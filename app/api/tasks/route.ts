import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID = ["TODO", "IN_PROGRESS", "DONE"];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  } catch (err) {
    console.error("[TASKS GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, status } = await req.json();
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: "Title too long (max 200 chars)" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: VALID.includes(status) ? status : "TODO",
        userId: session.user.id,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    console.error("[TASKS POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
