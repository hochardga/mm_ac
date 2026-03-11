import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { users } from "@/db/schema";
import { comparePassword } from "@/features/auth/password";
import { getDb } from "@/lib/db";

export function isProtectedPath(pathname: string) {
  return pathname === "/vault" || pathname.startsWith("/cases/");
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "test-secret",
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Agent Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const db = await getDb();
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await comparePassword(
          credentials.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.alias,
        };
      },
    }),
  ],
};
