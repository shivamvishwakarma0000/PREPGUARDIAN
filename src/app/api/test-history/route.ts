import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const history = await prisma.testHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Fetch Test History Error:", error);
    return NextResponse.json({ error: "Failed to fetch test history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topic, score, totalQuestions, passed } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const testAttempt = await prisma.testHistory.create({
      data: {
        userId: user.id,
        topic,
        score,
        totalQuestions,
        passed,
      },
    });

    return NextResponse.json({ message: "Test history saved", testAttempt });
  } catch (error) {
    console.error("Save Test History Error:", error);
    return NextResponse.json({ error: "Failed to save test history" }, { status: 500 });
  }
}
