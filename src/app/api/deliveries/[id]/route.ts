import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        destinationCenter: true,
        driverUser: { select: { id: true, name: true, phone: true, email: true } },
        request: {
          include: {
            disaster: true,
            requester: { select: { id: true, name: true, email: true } },
          },
        },
        items: {
          include: {
            resource: true,
            allocation: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: "Delivery shipment not found" }, { status: 404 });
    }

    return NextResponse.json({ delivery });
  } catch (error) {
    console.error("GET /api/deliveries/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch delivery details" }, { status: 500 });
  }
}
