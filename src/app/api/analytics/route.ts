import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      activeDisastersCount,
      totalPopulation,
      pendingRequestsCount,
      criticalRequestsCount,
      totalResourcesCount,
      lowStockCount,
      activeDeliveriesCount,
      volunteerCount,
      disastersBySeverity,
      disastersByType,
      resourcesByCategory,
      requestsByStatus,
      deliveriesByStatus,
    ] = await Promise.all([
      prisma.disaster.count({ where: { status: "Active" } }),
      prisma.disaster.aggregate({
        where: { status: "Active" },
        _sum: { estimatedPopulation: true },
      }),
      prisma.resourceRequest.count({ where: { status: "Pending" } }),
      prisma.resourceRequest.count({ where: { priority: "Critical", status: "Pending" } }),
      prisma.resource.count(),
      prisma.resource.count({ where: { OR: [{ status: "Low_Stock" }, { status: "Out_of_Stock" }] } }),
      prisma.delivery.count({ where: { status: { in: ["Dispatched", "In_Transit"] } } }),
      prisma.volunteer.count(),
      prisma.disaster.groupBy({
        by: ["severity"],
        _count: { id: true },
      }),
      prisma.disaster.groupBy({
        by: ["type"],
        _count: { id: true },
      }),
      prisma.resource.groupBy({
        by: ["category"],
        _sum: { quantity: true },
        _count: { id: true },
      }),
      prisma.resourceRequest.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.delivery.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        activeDisasters: activeDisastersCount,
        affectedPopulation: totalPopulation._sum.estimatedPopulation || 0,
        pendingRequests: pendingRequestsCount,
        criticalRequests: criticalRequestsCount,
        totalResources: totalResourcesCount,
        lowStockItems: lowStockCount,
        activeDeliveries: activeDeliveriesCount,
        totalVolunteers: volunteerCount,
      },
      charts: {
        disastersBySeverity: disastersBySeverity.map((d) => ({ name: d.severity, value: d._count.id })),
        disastersByType: disastersByType.map((d) => ({ name: d.type, value: d._count.id })),
        resourcesByCategory: resourcesByCategory.map((r) => ({
          name: r.category.replace("_", " "),
          quantity: r._sum.quantity || 0,
          itemsCount: r._count.id,
        })),
        requestsByStatus: requestsByStatus.map((r) => ({ name: r.status.replace("_", " "), value: r._count.id })),
        deliveriesByStatus: deliveriesByStatus.map((d) => ({ name: d.status.replace("_", " "), value: d._count.id })),
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
