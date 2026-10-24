import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resourceRequestSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { RequestPriority, RequestStatus, NotificationType, Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (priority) where.priority = priority;
    if (status) where.status = status;

    const requests = await prisma.resourceRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        disaster: { select: { id: true, name: true, severity: true } },
        destinationCenter: { select: { id: true, name: true, city: true, type: true } },
        items: {
          include: {
            resource: { select: { id: true, name: true, unit: true, quantity: true } },
          },
        },
        allocations: {
          include: {
            resource: true,
            allocatedBy: { select: { id: true, name: true } },
          },
        },
        deliveries: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: "Failed to fetch resource requests" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = resourceRequestSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errorMsg || "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;

    // Verify disaster exists and is not closed/resolved
    const targetDisaster = await prisma.disaster.findUnique({
      where: { id: data.disasterId },
    });

    if (!targetDisaster) {
      return NextResponse.json({ error: "Selected disaster not found" }, { status: 404 });
    }

    if (targetDisaster.status === "Resolved") {
      return NextResponse.json(
        { error: "Cannot submit resource requisitions for a resolved disaster incident." },
        { status: 400 }
      );
    }

    const resourceRequest = await prisma.resourceRequest.create({
      data: {
        requesterId: session.id,
        disasterId: data.disasterId,
        destinationCenterId: data.destinationCenterId,
        priority: data.priority as RequestPriority,
        justification: data.justification,
        status: RequestStatus.Pending,
        items: {
          create: data.items.map((item) => ({
            resourceId: item.resourceId || null,
            category: item.category,
            requestedQuantity: item.requestedQuantity,
          })),
        },
      },
      include: {
        destinationCenter: true,
        disaster: true,
        items: true,
      },
    });

    await logAuditAction({
      action: "REQUEST_CREATED",
      entity: "ResourceRequest",
      entityId: resourceRequest.id,
      performedById: session.id,
      details: `Created ${resourceRequest.priority} resource request for ${resourceRequest.destinationCenter.name}`,
    });

    if (resourceRequest.priority === RequestPriority.Critical || resourceRequest.priority === RequestPriority.High) {
      await prisma.notification.create({
        data: {
          title: `CRITICAL REQUEST: ${resourceRequest.destinationCenter.name}`,
          message: `${resourceRequest.priority} request submitted for disaster '${resourceRequest.disaster.name}'.`,
          type: NotificationType.CRITICAL_REQUEST,
          link: "/requests",
        },
      });
    }

    return NextResponse.json({ request: resourceRequest }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: "Failed to create resource request" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Request ID and status required" }, { status: 400 });
    }

    const existingReq = await prisma.resourceRequest.findUnique({
      where: { id },
    });

    if (!existingReq) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 });
    }

    if (existingReq.status === RequestStatus.Fulfilled && status !== RequestStatus.Fulfilled) {
      return NextResponse.json(
        { error: "Business rule violation: Fulfilled requisitions cannot be modified." },
        { status: 400 }
      );
    }

    if (existingReq.status === RequestStatus.Cancelled && status !== RequestStatus.Cancelled) {
      return NextResponse.json(
        { error: "Business rule violation: Cancelled requisitions cannot be modified." },
        { status: 400 }
      );
    }

    // Role check for approving/rejecting
    if (
      (status === "Approved" || status === "Rejected") &&
      session.role !== Role.ADMIN &&
      session.role !== Role.DISASTER_OFFICER &&
      session.role !== Role.RESOURCE_MANAGER
    ) {
      return NextResponse.json({ error: "Forbidden: Officers/Managers only" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "Approved") updateData.approvedDate = new Date();
    if (status === "Fulfilled") updateData.fulfilledDate = new Date();

    const resourceRequest = await prisma.resourceRequest.update({
      where: { id },
      data: updateData,
      include: { destinationCenter: true, requester: true },
    });

    await logAuditAction({
      action: `REQUEST_${status.toUpperCase()}`,
      entity: "ResourceRequest",
      entityId: resourceRequest.id,
      performedById: session.id,
      details: `Resource request status changed to ${status}`,
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: resourceRequest.requesterId,
        title: `Request ${status}`,
        message: `Your resource request for ${resourceRequest.destinationCenter.name} has been set to ${status}.`,
        type: NotificationType.REQUEST_STATUS,
        link: "/requests",
      },
    });

    return NextResponse.json({ request: resourceRequest });
  } catch (error) {
    console.error("PUT /api/requests error:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
