import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, subscriptions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   allowDangerousEmailAccountLinking: true,
    // }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          if (!user) {
            return null;
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          // Check if user is locked out
          if (user.lockedUntil && new Date() < user.lockedUntil) {
            throw new Error("Account is temporarily locked");
          }

          // Verify password
          if (!user.password) {
            throw new Error("Please sign in with Google");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            // Increment login attempts
            await db
              .update(users)
              .set({
                loginAttempts: user.loginAttempts + 1,
                lockedUntil: user.loginAttempts >= 9 ? new Date(Date.now() + 30 * 60 * 1000) : null, // 30 min lockout after 10 attempts
              })
              .where(eq(users.id, user.id));

            return null;
          }

          // Check subscription status
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.orgId, user.orgId))
            .limit(1);

          if (!subscription || subscription.status !== "active") {
            throw new Error("Subscription is not active");
          }

          // Reset login attempts on successful login
          await db
            .update(users)
            .set({
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date(),
              lastLoginIp: null, // TODO: Get IP from request
            })
            .where(eq(users.id, user.id));

          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            image: user.avatar,
            orgId: user.orgId,
            role: user.role,
            isMasterOwner: user.isMasterOwner,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if user exists and has active subscription
      if (account?.provider === "google" && user.email) {
        try {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (!existingUser) {
            // User doesn't exist, deny sign in
            return false;
          }

          if (!existingUser.isActive) {
            return false;
          }

          // Check subscription status
          const [subscription] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.orgId, existingUser.orgId))
            .limit(1);

          if (!subscription || subscription.status !== "active") {
            return false;
          }

          // Update last login
          await db
            .update(users)
            .set({
              lastLoginAt: new Date(),
              emailVerifiedAt: existingUser.emailVerifiedAt || new Date(),
            })
            .where(eq(users.id, existingUser.id));

          return true;
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Add custom fields to token
        token.orgId = user.orgId;
        token.role = user.role;
        token.isMasterOwner = user.isMasterOwner;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Add custom fields to session
        session.user.id = token.sub!;
        session.user.orgId = token.orgId as number;
        session.user.role = token.role as string;
        session.user.isMasterOwner = token.isMasterOwner as boolean;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  events: {
    async signIn({ user }) {
      // Track usage - user login
      // TODO: Implement usage tracking
    },
  },
};