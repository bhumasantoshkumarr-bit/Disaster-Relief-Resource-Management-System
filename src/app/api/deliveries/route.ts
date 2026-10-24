import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deliverySchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { DeliveryStatus, RequestStatus, NotificationType, Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        request: {
          include: {
            disaster: { select: { id: true, name: true } },
          },
        },
        sourceWarehouse: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        destinationCenter: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        items: {
          include: {
            resource: { select: { id: true, name: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ deliveries });
  } catch (error) {
    console.error("GET /api/deliveries error:", error);
    return NextResponse.json({ error: "Failed to fetch deliveries" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      session.role !== Role.ADMIN &&
      session.role !== Role.DISASTER_OFFICER &&
      session.role !== Role.RESOURCE_MANAGER
    ) {
      return NextResponse.json({ error: "Forbidden: Officer or Manager role required to dispatch" }, { status: 403 });
    }

    const body = await req.json();
    const validated = deliverySchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Fetch allocations for this request to populate manifest
    const allocations = await prisma.resourceAllocation.findMany({
      where: { requestId: data.requestId },
    });

    const delivery = await prisma.delivery.create({
      data: {
        requestId: data.requestId,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationCenterId: data.destinationCenterId,
        assignedVehicle: data.assignedVehicle,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        status: DeliveryStatus.Dispatched,
        departureTime: new Date(),
        estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null,
        trackingNotes: data.trackingNotes || "Shipment dispatched from warehouse.",
        items: allocations.length > 0 ? {
          create: allocations.map((alloc) => ({
            resourceId: alloc.resourceId,
            allocationId: alloc.id,
            quantity: alloc.allocatedQuantity,
          })),
        } : undefined,
      },
      include: {
        sourceWarehouse: true,
        destinationCenter: true,
        items: true,
      },
    });

    await logAuditAction({
      action: "DELIVERY_CREATED",
      entity: "Delivery",
      entityId: delivery.id,
      performedById: session.id,
      details: `Dispatched shipment '${delivery.assignedVehicle}' from ${delivery.sourceWarehouse.name} to ${delivery.destinationCenter.name}`,
    });

    await prisma.notification.create({
      data: {
        title: "SHIPMENT DISPATCHED",
        message: `Vehicle ${delivery.assignedVehicle} (Driver: ${delivery.driverName}) dispatched to ${delivery.destinationCenter.name}.`,
        type: NotificationType.DELIVERY_UPDATE,
        link: "/deliveries",
      },
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    console.error("POST /api/deliveries error:", error);
    return NextResponse.json({ error: "Failed to create delivery" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, trackingNotes, estimatedArrival } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Delivery ID and status required" }, { status: 400 });
    }

    const existingDelivery = await prisma.delivery.findUnique({ where: { id } });
    if (!existingDelivery) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    // Business Logic: Delivered shipments cannot be modified or re-dispatched
    if (existingDelivery.status === DeliveryStatus.Delivered && status !== DeliveryStatus.Delivered) {
      return NextResponse.json(
        { error: "Business rule violation: Delivered shipments cannot be re-dispatched or status modified." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status: status as DeliveryStatus,
    };

    if (trackingNotes !== undefined) {
      updateData.trackingNotes = trackingNotes;
    }

    if (estimatedArrival) {
      updateData.estimatedArrival = new Date(estimatedArrival);
    }

    if (status === DeliveryStatus.Delivered) {
      updateData.actualArrival = new Date();
    } else if (status === DeliveryStatus.Dispatched && !existingDelivery.departureTime) {
      updateData.departureTime = new Date();
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: { destinationCenter: true, request: true },
    });

    if (status === DeliveryStatus.Delivered) {
      // Mark associated request as Fulfilled
      await prisma.resourceRequest.update({
        where: { id: delivery.requestId },
        data: {
          status: RequestStatus.Fulfilled,
          fulfilledDate: new Date(),
        },
      });
    }

    await logAuditAction({
      action: `DELIVERY_${status.toUpperCase()}`,
      entity: "Delivery",
      entityId: delivery.id,
      performedById: session.id,
      details: `Delivery status updated to ${status} for destination ${delivery.destinationCenter.name}`,
    });

    await prisma.notification.create({
      data: {
        title: `DELIVERY STATUS: ${status}`,
        message: `Shipment for ${delivery.destinationCenter.name} status updated to ${status}.`,
        type: NotificationType.DELIVERY_UPDATE,
        link: `/deliveries/${delivery.id}`,
      },
    });

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("PUT /api/deliveries error:", error);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
