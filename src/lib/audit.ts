import { prisma } from "./prisma";

export async function logAuditAction(params: {
  action: string;
  entity: string;
  entityId?: string;
  performedById?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        performedById: params.performedById,
        details: params.details,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    console.error("Audit logging error:", err);
  }
}
