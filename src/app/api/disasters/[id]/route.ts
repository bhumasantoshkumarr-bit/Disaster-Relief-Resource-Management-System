import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const disaster = await prisma.disaster.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        requests: {
          include: {
            destinationCenter: true,
            items: true,
            deliveries: true,
          },
          orderBy: { createdAt: "desc" },
        },
        volunteers: {
          include: { tasks: true },
        },
        tasks: {
          include: { assignedVolunteer: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!disaster) {
      return NextResponse.json({ error: "Disaster not found" }, { status: 404 });
    }

    return NextResponse.json({ disaster });
  } catch (error) {
    console.error("GET /api/disasters/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch disaster details" }, { status: 500 });
  }
}
