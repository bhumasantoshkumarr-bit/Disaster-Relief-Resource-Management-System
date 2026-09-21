import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { warehouseSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        resources: true,
        _count: {
          select: {
            resources: true,
            deliveriesFrom: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ warehouses });
  } catch (error) {
    console.error("GET /api/warehouses error:", error);
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.RESOURCE_MANAGER)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = warehouseSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Validation error", details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.create({
      data: validated.data,
    });

    await logAuditAction({
      action: "WAREHOUSE_CREATED",
      entity: "Warehouse",
      entityId: warehouse.id,
      performedById: session.id,
      details: `Created warehouse '${warehouse.name}' in ${warehouse.city}, ${warehouse.state}`,
    });

    return NextResponse.json({ warehouse }, { status: 201 });
  } catch (error) {
    console.error("POST /api/warehouses error:", error);
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.RESOURCE_MANAGER)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 });
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });

    await logAuditAction({
      action: "WAREHOUSE_UPDATED",
      entity: "Warehouse",
      entityId: warehouse.id,
      performedById: session.id,
      details: `Updated warehouse ${warehouse.name}`,
    });

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error("PUT /api/warehouses error:", error);
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 });
  }
}
