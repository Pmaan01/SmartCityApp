import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { sendEmail } from "@/lib/notifications";
import { welcomeEmail } from "@/lib/email-templates";
type DBUser = { role?: Role; phone?: string | null };

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  logger: {
    error: (e) => console.error("[auth]", e),
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as DBUser).role ?? "CITIZEN";
        session.user.phone = (user as DBUser).phone ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.email) return;
      const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
      const { subject, html } = welcomeEmail({ userName: user.name ?? "", appUrl });
      sendEmail(user.email, subject, html).catch(() => {});
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      phone?: string | null;
    };
  }
}
