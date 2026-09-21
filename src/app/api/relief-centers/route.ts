import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reliefCenterSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const centers = await prisma.reliefCenter.findMany({
      include: {
        _count: {
          select: {
            requests: true,
            deliveriesTo: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ centers });
  } catch (error) {
    console.error("GET /api/relief-centers error:", error);
    return NextResponse.json({ error: "Failed to fetch relief centers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.DISASTER_OFFICER && session.role !== Role.RELIEF_CAMP_MANAGER)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = reliefCenterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Validation error", details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const center = await prisma.reliefCenter.create({
      data: validated.data,
    });

    await logAuditAction({
      action: "RELIEF_CENTER_CREATED",
      entity: "ReliefCenter",
      entityId: center.id,
      performedById: session.id,
      details: `Created relief center '${center.name}' (${center.type}) in ${center.city}`,
    });

    return NextResponse.json({ center }, { status: 201 });
  } catch (error) {
    console.error("POST /api/relief-centers error:", error);
    return NextResponse.json({ error: "Failed to create relief center" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Center ID is required" }, { status: 400 });
    }

    const center = await prisma.reliefCenter.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      action: "RELIEF_CENTER_UPDATED",
      entity: "ReliefCenter",
      entityId: center.id,
      performedById: session.id,
      details: `Updated relief center ${center.name}`,
    });

    return NextResponse.json({ center });
  } catch (error) {
    console.error("PUT /api/relief-centers error:", error);
    return NextResponse.json({ error: "Failed to update relief center" }, { status: 500 });
  }
}
