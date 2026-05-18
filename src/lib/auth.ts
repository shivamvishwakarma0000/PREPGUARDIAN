import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("No cadet is enlisted with this email.");
        }

        if (!user.password) {
          throw new Error("This account is configured for Google sign-in only.");
        }

        const hashedPassword = hashPassword(credentials.password);

        if (user.password !== hashedPassword) {
          throw new Error("Incorrect password.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Create a default profile for new OAuth users if they don't already have one
      const existingProfile = await prisma.profile.findUnique({
        where: { userId: user.id }
      });
      
      if (!existingProfile) {
        await prisma.profile.create({
          data: {
            userId: user.id,
            xp: 0,
            level: 1,
            currentStreak: 0,
            rankTitle: "Cadet",
          },
        });
      }
    },
  },
  pages: {
    signIn: "/", 
  },
};
