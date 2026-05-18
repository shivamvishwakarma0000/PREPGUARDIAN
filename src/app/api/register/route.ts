import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All enlistment details are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "This email is already enlisted." }, { status: 400 });
    }

    // Securely hash password using SHA-256
    const hashedPassword = hashPassword(password);

    // Generate secure recovery clearance code
    const recoveryCode = `PG-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create user and profile inside a single transaction
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        recoveryCode,
        profile: {
          create: {
            xp: 0,
            level: 1,
            currentStreak: 0,
            rankTitle: "Cadet",
            coins: 100,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        recoveryCode: true,
      },
    });

    return NextResponse.json({ 
      user: newUser, 
      recoveryCode,
      message: "Enlistment successful! Write down your Clearance Recovery Code." 
    });

  } catch (error: any) {
    console.error("Enlistment Registration Error:", error);
    return NextResponse.json({ error: error.message || "Failed to enlist cadet." }, { status: 500 });
  }
}
