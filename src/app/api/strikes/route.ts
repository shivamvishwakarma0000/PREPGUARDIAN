import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await req.json();
    const userId = (session.user as any).id;
    const penalty = 20;

    let lockoutTriggered = false;
    let currentCoins = 100;

    // Use a transaction to create the strike and update the profile
    await prisma.$transaction(async (tx: any) => {
      await tx.strike.create({
        data: {
          userId: userId,
          reason: reason || "Unknown infraction",
          xpPenalty: penalty,
        },
      });

      const profile = await tx.profile.findUnique({
        where: { userId },
      });

      if (profile) {
        // Decrement XP, ensuring it doesn't go below 0
        const newXp = Math.max(0, profile.xp - penalty);
        // Reset streak on infraction
        const newStreak = 0;
        
        // Deduct 20 coins
        let newCoins = profile.coins - penalty;
        let lockoutUntil: Date | null = profile.lockoutUntil;

        if (newCoins <= 0) {
          newCoins = 0;
          lockoutTriggered = true;
          // Set lockout for 2 hours
          lockoutUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
        }

        currentCoins = newCoins;

        await tx.profile.update({
          where: { userId },
          data: {
            xp: newXp,
            currentStreak: newStreak,
            coins: newCoins,
            lockoutUntil: lockoutUntil,
          },
        });
      }
    });

    return NextResponse.json({ 
      message: "Strike recorded successfully.", 
      coins: currentCoins,
      lockoutTriggered 
    });
  } catch (error) {
    console.error("Failed to record strike:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
