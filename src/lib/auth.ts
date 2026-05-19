import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "./rateLimit";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Rate limit by email: 10 attempts per 15 minutes
        const emailKey = `login:email:${credentials.email.toLowerCase()}`;
        if (!rateLimit(emailKey, 10, 15 * 60 * 1000)) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;
        if (user.banned) return null; // Account suspended
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete ?? false;
        token.emailVerified = (user as { emailVerified?: boolean }).emailVerified ?? false;
      }
      // Re-check DB until onboarding is done (avoids stale JWT after user completes onboarding)
      if (token.id && (!token.onboardingComplete || !token.emailVerified)) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingComplete: true, emailVerified: true },
        });
        if (fresh?.onboardingComplete) token.onboardingComplete = true;
        if (fresh?.emailVerified) token.emailVerified = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const u = session.user as { id?: string; onboardingComplete?: boolean; emailVerified?: boolean };
        u.id = token.id as string;
        u.onboardingComplete = token.onboardingComplete as boolean;
        u.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
