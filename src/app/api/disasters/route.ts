import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { disasterSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { Role, NotificationType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const disasters = await prisma.disaster.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            requests: true,
            volunteers: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ disasters });
  } catch (error) {
    console.error("GET /api/disasters error:", error);
    return NextResponse.json({ error: "Failed to fetch disasters" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== Role.ADMIN && session.role !== Role.DISASTER_OFFICER) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const validated = disasterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;
    const disaster = await prisma.disaster.create({
      data: {
        name: data.name,
        type: data.type,
        description: data.description,
        severity: data.severity,
        status: data.status,
        affectedArea: data.affectedArea,
        latitude: data.latitude,
        longitude: data.longitude,
        estimatedPopulation: data.estimatedPopulation,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        createdById: session.id,
      },
    });

    await logAuditAction({
      action: "DISASTER_CREATED",
      entity: "Disaster",
      entityId: disaster.id,
      performedById: session.id,
      details: `Disaster '${disaster.name}' (${disaster.severity}) created for ${disaster.affectedArea}`,
    });

    // Create system notification
    await prisma.notification.create({
      data: {
        title: `NEW DISASTER ALERT: ${disaster.name}`,
        message: `Disaster ${disaster.name} (${disaster.type}) registered in ${disaster.affectedArea}. Severity: ${disaster.severity}.`,
        type: NotificationType.DISASTER_ALERT,
        link: "/disasters",
      },
    });

    return NextResponse.json({ disaster }, { status: 201 });
  } catch (error) {
    console.error("POST /api/disasters error:", error);
    return NextResponse.json({ error: "Failed to create disaster" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== Role.ADMIN && session.role !== Role.DISASTER_OFFICER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Disaster ID is required" }, { status: 400 });
    }

    const disaster = await prisma.disaster.update({
      where: { id },
      data: {
        ...updateData,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
      },
    });

    await logAuditAction({
      action: "DISASTER_UPDATED",
      entity: "Disaster",
      entityId: disaster.id,
      performedById: session.id,
      details: `Updated disaster ${disaster.name} details/status.`,
    });

    return NextResponse.json({ disaster });
  } catch (error) {
    console.error("PUT /api/disasters error:", error);
    return NextResponse.json({ error: "Failed to update disaster" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.disaster.delete({ where: { id } });

    await logAuditAction({
      action: "DISASTER_DELETED",
      entity: "Disaster",
      entityId: id,
      performedById: session.id,
      details: `Deleted disaster record ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/disasters error:", error);
    return NextResponse.json({ error: "Failed to delete disaster" }, { status: 500 });
  }
}
