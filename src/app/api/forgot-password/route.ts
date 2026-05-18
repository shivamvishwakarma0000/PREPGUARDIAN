import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: Request) {
  try {
    const { email, recoveryCode, newPassword } = await req.json();

    if (!email || !recoveryCode || !newPassword) {
      return NextResponse.json({ error: "All reset clearance fields are required." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
    }

    // Find cadet by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "No cadet is enlisted with this email." }, { status: 400 });
    }

    if (!user.recoveryCode) {
      return NextResponse.json({ error: "This account has no recovery key. Please contact support." }, { status: 400 });
    }

    // Verify recovery key (case-insensitive and trimmed)
    if (user.recoveryCode.trim().toLowerCase() !== recoveryCode.trim().toLowerCase()) {
      return NextResponse.json({ error: "Invalid Clearance Recovery Key." }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = hashPassword(newPassword);

    // Save password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Security Clearance Reset Successful! You may now sign in with your new password." });

  } catch (error: any) {
    console.error("Password Recovery Reset Error:", error);
    return NextResponse.json({ error: error.message || "Failed to reset security credentials." }, { status: 500 });
  }
}
