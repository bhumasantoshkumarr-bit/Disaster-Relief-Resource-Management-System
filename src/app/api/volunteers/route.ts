import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { volunteerSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";

export async function GET() {
  try {
    const volunteers = await prisma.volunteer.findMany({
      include: {
        assignedDisaster: { select: { id: true, name: true, severity: true } },
        tasks: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ volunteers });
  } catch (error) {
    console.error("GET /api/volunteers error:", error);
    return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = volunteerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const volunteer = await prisma.volunteer.create({
      data: validated.data,
    });

    await logAuditAction({
      action: "VOLUNTEER_REGISTERED",
      entity: "Volunteer",
      entityId: volunteer.id,
      performedById: session.id,
      details: `Registered volunteer ${volunteer.name} (${volunteer.skills})`,
    });

    return NextResponse.json({ volunteer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/volunteers error:", error);
    return NextResponse.json({ error: "Failed to register volunteer" }, { status: 500 });
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
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const volunteer = await prisma.volunteer.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      action: "VOLUNTEER_UPDATED",
      entity: "Volunteer",
      entityId: volunteer.id,
      performedById: session.id,
      details: `Updated volunteer ${volunteer.name}`,
    });

    return NextResponse.json({ volunteer });
  } catch (error) {
    console.error("PUT /api/volunteers error:", error);
    return NextResponse.json({ error: "Failed to update volunteer" }, { status: 500 });
  }
}
