import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { taskSchema } from "@/lib/validations";
import { logAuditAction } from "@/lib/audit";
import { NotificationType } from "@prisma/client";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        disaster: { select: { id: true, name: true } },
        assignedVolunteer: { select: { id: true, name: true, phone: true, skills: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = taskSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: errorMsg || "Validation error", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = validated.data;
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        disasterId: data.disasterId,
        assignedVolunteerId: data.assignedVolunteerId || null,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: {
        disaster: true,
        assignedVolunteer: true,
      },
    });

    await logAuditAction({
      action: "TASK_CREATED",
      entity: "Task",
      entityId: task.id,
      performedById: session.id,
      details: `Task '${task.title}' created for disaster ${task.disaster.name}`,
    });

    if (task.assignedVolunteer) {
      await prisma.notification.create({
        data: {
          title: `TASK ASSIGNED: ${task.title}`,
          message: `Task assigned to volunteer ${task.assignedVolunteer.name} for ${task.disaster.name}.`,
          type: NotificationType.TASK_ASSIGNED,
          link: "/tasks",
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
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
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      },
    });

    await logAuditAction({
      action: "TASK_UPDATED",
      entity: "Task",
      entityId: task.id,
      performedById: session.id,
      details: `Updated task '${task.title}' status to ${task.status}`,
    });

    await prisma.notification.create({
      data: {
        title: `TASK UPDATE: ${task.title}`,
        message: `Field task '${task.title}' has been updated to status ${task.status.replace("_", " ")}.`,
        type: NotificationType.TASK_ASSIGNED,
        link: "/tasks",
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error("PUT /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
