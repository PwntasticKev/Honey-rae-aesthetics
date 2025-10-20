import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: number;
      role: string;
      isMasterOwner: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    orgId: number;
    role: string;
    isMasterOwner: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    orgId: number;
    role: string;
    isMasterOwner: boolean;
  }
}