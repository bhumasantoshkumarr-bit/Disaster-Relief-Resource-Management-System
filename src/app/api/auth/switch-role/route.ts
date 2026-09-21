import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, getCookieName } from "@/lib/auth";
import { Role } from "@prisma/client";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { role } = await req.json();

    if (!Object.values(Role).includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { role: role as Role },
    });

    if (!user) {
      return NextResponse.json({ error: `No user found with role ${role}` }, { status: 404 });
    }

    const sessionData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      reliefCenterId: user.reliefCenterId,
      warehouseId: user.warehouseId,
    };

    const token = signToken(sessionData);

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    });

    response.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await logAuditAction({
      action: "ROLE_SWITCH",
      entity: "User",
      entityId: user.id,
      performedById: user.id,
      details: `Switched demo role context to ${user.role} (${user.email}).`,
    });

    return response;
  } catch (error) {
    console.error("Role switch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
