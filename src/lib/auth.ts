import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create a default profile for new users
      await prisma.profile.create({
        data: {
          userId: user.id,
          xp: 0,
          level: 1,
          currentStreak: 0,
          rankTitle: "Cadet",
        },
      });
    },
  },
  pages: {
    signIn: "/", // We will build a custom sign-in on the landing page
  },
};
