import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        disaster: true,
        destinationCenter: true,
        items: {
          include: {
            resource: {
              select: {
                id: true,
                name: true,
                unit: true,
                quantity: true,
                status: true,
                warehouse: { select: { id: true, name: true, city: true } },
              },
            },
          },
        },
        allocations: {
          include: {
            resource: {
              include: { warehouse: true },
            },
            allocatedBy: { select: { id: true, name: true, email: true, role: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        deliveries: {
          include: {
            sourceWarehouse: true,
            destinationCenter: true,
            items: { include: { resource: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!resourceRequest) {
      return NextResponse.json({ error: "Resource request not found" }, { status: 404 });
    }

    return NextResponse.json({ request: resourceRequest });
  } catch (error) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch request details" }, { status: 500 });
  }
}
