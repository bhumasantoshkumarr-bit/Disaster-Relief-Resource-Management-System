import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "30d"; // 7d, 30d, 90d, all

    const now = new Date();
    let startDate = new Date();
    if (timeframe === "7d") startDate.setDate(now.getDate() - 7);
    else if (timeframe === "30d") startDate.setDate(now.getDate() - 30);
    else if (timeframe === "90d") startDate.setDate(now.getDate() - 90);
    else startDate = new Date(0);

    const [
      disastersCount,
      totalRequests,
      fulfilledRequests,
      pendingRequests,
      deliveries,
      warehouses,
      volunteers,
      resourcesByCategory,
    ] = await Promise.all([
      prisma.disaster.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.resourceRequest.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.resourceRequest.count({
        where: { createdAt: { gte: startDate }, status: "Fulfilled" },
      }),
      prisma.resourceRequest.count({
        where: { createdAt: { gte: startDate }, status: "Pending" },
      }),
      prisma.delivery.findMany({
        where: { createdAt: { gte: startDate } },
        select: { status: true },
      }),
      prisma.warehouse.findMany({
        select: { name: true, capacity: true, currentUtilization: true },
      }),
      prisma.volunteer.groupBy({
        by: ["availability"],
        _count: { id: true },
      }),
      prisma.resource.groupBy({
        by: ["category"],
        _sum: { quantity: true },
      }),
    ]);

    const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

    const deliveryPerformance = {
      total: deliveries.length,
      delivered: deliveries.filter((d) => d.status === "Delivered").length,
      inTransit: deliveries.filter((d) => d.status === "In_Transit" || d.status === "Dispatched").length,
      delayed: deliveries.filter((d) => d.status === "Delayed").length,
    };

    return NextResponse.json({
      timeframe,
      metrics: {
        disastersCount,
        totalRequests,
        fulfilledRequests,
        pendingRequests,
        fulfillmentRate,
      },
      deliveryPerformance,
      warehouseUtilization: warehouses.map((w) => ({
        name: w.name,
        capacity: w.capacity,
        utilization: w.currentUtilization,
      })),
      volunteerParticipation: volunteers.map((v) => ({
        status: v.availability,
        count: v._count.id,
      })),
      resourceCategoryDistribution: resourcesByCategory.map((r) => ({
        category: r.category.replace("_", " "),
        quantity: r._sum.quantity || 0,
      })),
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports data" }, { status: 500 });
  }
}
