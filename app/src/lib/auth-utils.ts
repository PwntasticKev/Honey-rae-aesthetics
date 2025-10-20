import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "./lib/db";
import { users, passwordResets, userInvitations, orgInvitations } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Generate a secure password reset token
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.insert(passwordResets).values({
    email,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Verify and use a password reset token
 */
export async function verifyPasswordResetToken(token: string, email: string): Promise<boolean> {
  const [resetRecord] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.token, token),
        eq(passwordResets.email, email),
        gt(passwordResets.expiresAt, new Date()),
        eq(passwordResets.usedAt, null)
      )
    )
    .limit(1);

  if (!resetRecord) {
    return false;
  }

  // Mark token as used
  await db
    .update(passwordResets)
    .set({ usedAt: new Date() })
    .where(eq(passwordResets.id, resetRecord.id));

  return true;
}

/**
 * Generate invitation token for user
 */
export async function generateUserInvitation(
  orgId: number,
  email: string,
  role: "admin" | "manager" | "staff",
  invitedBy: number,
  permissions?: string[]
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(userInvitations).values({
    orgId,
    email,
    role,
    invitedBy,
    token,
    permissions,
    expiresAt,
  });

  return token;
}

/**
 * Generate invitation token for new organization
 */
export async function generateOrgInvitation(
  email: string,
  orgName: string,
  invitedBy: number
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(orgInvitations).values({
    email,
    orgName,
    invitedBy,
    token,
    expiresAt,
  });

  return token;
}

/**
 * Verify user invitation token
 */
export async function verifyUserInvitation(token: string) {
  const [invitation] = await db
    .select()
    .from(userInvitations)
    .where(
      and(
        eq(userInvitations.token, token),
        eq(userInvitations.status, "pending"),
        gt(userInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  return invitation;
}

/**
 * Verify organization invitation token
 */
export async function verifyOrgInvitation(token: string) {
  const [invitation] = await db
    .select()
    .from(orgInvitations)
    .where(
      and(
        eq(orgInvitations.token, token),
        eq(orgInvitations.status, "pending"),
        gt(orgInvitations.expiresAt, new Date())
      )
    )
    .limit(1);

  return invitation;
}

/**
 * Generate 2FA secret and QR code for user
 */
export async function generate2FASecret(userEmail: string, userName: string) {
  const secret = speakeasy.generateSecret({
    name: userName,
    issuer: "Honey Rae Aesthetics",
    length: 32,
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32,
  };
}

/**
 * Verify 2FA token
 */
export function verify2FAToken(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2, // Allow 2 steps tolerance
  });
}

/**
 * Generate backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

/**
 * Check if user is master owner
 */
export function isMasterOwner(user: { isMasterOwner: boolean; orgId: number }): boolean {
  return user.isMasterOwner && user.orgId === 1; // Honey Rae Aesthetics is org ID 1
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}