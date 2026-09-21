import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resourceSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { Role, ResourceStatus, NotificationType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get("warehouseId");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (category) where.category = category;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true, city: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.RESOURCE_MANAGER)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validated = resourceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: "Validation error", details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = validated.data;
    let computedStatus: ResourceStatus = ResourceStatus.Available;

    if (data.quantity === 0) {
      computedStatus = ResourceStatus.Out_of_Stock;
    } else if (data.quantity <= data.minStockLevel) {
      computedStatus = ResourceStatus.Low_Stock;
    }

    const resource = await prisma.resource.create({
      data: {
        name: data.name,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity,
        minStockLevel: data.minStockLevel,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        warehouseId: data.warehouseId,
        status: computedStatus,
      },
      include: { warehouse: true },
    });

    await logAuditAction({
      action: "RESOURCE_CREATED",
      entity: "Resource",
      entityId: resource.id,
      performedById: session.id,
      details: `Added ${resource.quantity} ${resource.unit} of '${resource.name}' to ${resource.warehouse.name}`,
    });

    if (computedStatus === ResourceStatus.Low_Stock || computedStatus === ResourceStatus.Out_of_Stock) {
      await prisma.notification.create({
        data: {
          title: `STOCK WARNING: ${resource.name}`,
          message: `Resource '${resource.name}' at ${resource.warehouse.name} is currently ${computedStatus.replace("_", " ")} (${resource.quantity} ${resource.unit} left).`,
          type: NotificationType.LOW_INVENTORY,
          link: "/inventory",
        },
      });
    }

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== Role.ADMIN && session.role !== Role.RESOURCE_MANAGER)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, quantity, minStockLevel, ...rest } = body;

    if (!id) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    const existing = await prisma.resource.findUnique({
      where: { id },
      include: { warehouse: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const newQty = quantity !== undefined ? Number(quantity) : existing.quantity;
    const newMin = minStockLevel !== undefined ? Number(minStockLevel) : existing.minStockLevel;

    if (newQty < 0) {
      return NextResponse.json({ error: "Quantity cannot be negative" }, { status: 400 });
    }

    let computedStatus: ResourceStatus = ResourceStatus.Available;
    if (newQty === 0) {
      computedStatus = ResourceStatus.Out_of_Stock;
    } else if (newQty <= newMin) {
      computedStatus = ResourceStatus.Low_Stock;
    }

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...rest,
        quantity: newQty,
        minStockLevel: newMin,
        status: computedStatus,
        expiryDate: rest.expiryDate ? new Date(rest.expiryDate) : undefined,
      },
    });

    await logAuditAction({
      action: "RESOURCE_UPDATED",
      entity: "Resource",
      entityId: resource.id,
      performedById: session.id,
      details: `Updated stock level of '${resource.name}' to ${newQty} ${resource.unit}.`,
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("PUT /api/resources error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
