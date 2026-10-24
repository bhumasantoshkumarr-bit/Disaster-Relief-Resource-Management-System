import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocationSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { Role, ResourceStatus, RequestStatus, AllocationStatus, NotificationType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.DISASTER_OFFICER && session.role !== Role.RESOURCE_MANAGER)) {
      return NextResponse.json({ error: "Forbidden: Officer or Manager role required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = allocationSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { requestId, resourceId, allocatedQuantity, notes } = validated.data;

    // Execute atomic transaction for inventory deduction and allocation creation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch resource and lock check
      const resource = await tx.resource.findUnique({
        where: { id: resourceId },
        include: { warehouse: true },
      });

      if (!resource) {
        throw new Error("Target resource not found in inventory");
      }

      if (resource.quantity < allocatedQuantity) {
        throw new Error(`Insufficient inventory! Available: ${resource.quantity} ${resource.unit}, Requested allocation: ${allocatedQuantity} ${resource.unit}`);
      }

      // 2. Fetch request
      const reqRecord = await tx.resourceRequest.findUnique({
        where: { id: requestId },
        include: { items: true, destinationCenter: true, disaster: true },
      });

      if (!reqRecord) {
        throw new Error("Resource request not found");
      }

      // Business Rule: Closed/Resolved disasters or fulfilled/cancelled requests cannot be modified
      if (reqRecord.disaster.status === "Resolved") {
        throw new Error("Cannot allocate resources to a resolved disaster incident.");
      }

      if (reqRecord.status === RequestStatus.Fulfilled) {
        throw new Error("Cannot allocate resources to an already fulfilled requisition.");
      }

      if (reqRecord.status === RequestStatus.Cancelled || reqRecord.status === RequestStatus.Rejected) {
        throw new Error(`Cannot allocate resources to a ${reqRecord.status.toLowerCase()} requisition.`);
      }

      // Check item and prevent over-allocation
      const targetItem = reqRecord.items.find(
        (it) => it.resourceId === resourceId || it.category === resource.category
      );

      if (targetItem) {
        const remainingNeeded = targetItem.requestedQuantity - targetItem.fulfilledQuantity;
        if (remainingNeeded <= 0) {
          throw new Error(`Item ${targetItem.category.replace("_", " ")} has already been completely fulfilled.`);
        }
      }

      // 3. Deduct inventory safely
      const updatedQuantity = resource.quantity - allocatedQuantity;
      let newStatus: ResourceStatus = ResourceStatus.Available;
      if (updatedQuantity === 0) {
        newStatus = ResourceStatus.Out_of_Stock;
      } else if (updatedQuantity <= resource.minStockLevel) {
        newStatus = ResourceStatus.Low_Stock;
      }

      await tx.resource.update({
        where: { id: resourceId },
        data: {
          quantity: updatedQuantity,
          status: newStatus,
        },
      });

      if (newStatus === ResourceStatus.Low_Stock || newStatus === ResourceStatus.Out_of_Stock) {
        await tx.notification.create({
          data: {
            title: `LOW STOCK ALERT: ${resource.name}`,
            message: `Inventory for '${resource.name}' at ${resource.warehouse.name} dropped to ${updatedQuantity} ${resource.unit}.`,
            type: NotificationType.LOW_INVENTORY,
            link: "/resources",
          },
        });
      }

      // 4. Create Allocation record
      const allocation = await tx.resourceAllocation.create({
        data: {
          requestId,
          resourceId,
          allocatedQuantity,
          allocatedById: session.id,
          status: AllocationStatus.Allocated,
          notes,
        },
      });

      // 5. Update RequestItem fulfilled quantity
      let targetFulfilled = 0;
      if (targetItem) {
        targetFulfilled = targetItem.fulfilledQuantity + allocatedQuantity;
        await tx.requestItem.update({
          where: { id: targetItem.id },
          data: {
            resourceId,
            fulfilledQuantity: targetFulfilled,
          },
        });
      }

      // 6. Check if all items in the request are now fulfilled
      const allItemsFulfilled = reqRecord.items.every((it) => {
        const fulfilled = it.id === targetItem?.id ? targetFulfilled : it.fulfilledQuantity;
        return fulfilled >= it.requestedQuantity;
      });

      const nextStatus = allItemsFulfilled
        ? RequestStatus.Fulfilled
        : RequestStatus.Partially_Fulfilled;

      await tx.resourceRequest.update({
        where: { id: requestId },
        data: {
          status: nextStatus,
          approvedDate: reqRecord.approvedDate || new Date(),
          fulfilledDate: allItemsFulfilled ? new Date() : undefined,
        },
      });

      return { allocation, resource, destinationCenter: reqRecord.destinationCenter };
    });

    await logAuditAction({
      action: "RESOURCE_ALLOCATED",
      entity: "ResourceAllocation",
      entityId: result.allocation.id,
      performedById: session.id,
      details: `Allocated ${allocatedQuantity} ${result.resource.unit} of '${result.resource.name}' from ${result.resource.warehouse.name} to ${result.destinationCenter.name}`,
    });

    await prisma.notification.create({
      data: {
        title: "RESOURCE ALLOCATION EXECUTED",
        message: `${allocatedQuantity} ${result.resource.unit} of ${result.resource.name} allocated to ${result.destinationCenter.name}. Inventory remaining: ${result.resource.quantity - allocatedQuantity}.`,
        type: NotificationType.REQUEST_STATUS,
        link: "/requests",
      },
    });

    return NextResponse.json({ success: true, allocation: result.allocation }, { status: 201 });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Allocation failed";
    console.error("POST /api/allocations error:", errMessage);
    return NextResponse.json({ error: errMessage }, { status: 400 });
  }
}
