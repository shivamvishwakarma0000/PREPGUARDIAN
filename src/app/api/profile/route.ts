import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    let profile = await prisma.profile.findUnique({
      where: { userId },
    });

    // If profile doesn't exist, create one
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          userId,
          xp: 0,
          level: 1,
          coins: 100,
          badges: "",
        },
      });
    }

    // Check if lockout has expired
    if (profile.lockoutUntil && new Date() > new Date(profile.lockoutUntil)) {
      profile = await prisma.profile.update({
        where: { userId },
        data: {
          lockoutUntil: null,
          coins: 100, // Reset coins to 100 upon successful lockout completion!
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { xpReward, coinsReward, badgeToUnlock } = await req.json();

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let updatedBadges = profile.badges;
    if (badgeToUnlock) {
      const currentBadges = profile.badges ? profile.badges.split(",") : [];
      if (!currentBadges.includes(badgeToUnlock)) {
        currentBadges.push(badgeToUnlock);
        updatedBadges = currentBadges.join(",");
      }
    }

    const newXp = profile.xp + (xpReward || 0);
    // Simple leveling logic: every 100 XP is a level
    const newLevel = Math.floor(newXp / 100) + 1;
    const newCoins = profile.coins + (coinsReward || 0);

    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        xp: newXp,
        level: newLevel,
        coins: newCoins,
        badges: updatedBadges,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Failed to update profile rewards:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
