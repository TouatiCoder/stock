import { db } from "@/lib/db";
import { generateToken as edgeGenerateToken, verifyToken as edgeVerifyToken } from "@/lib/utils/edge-jwt";
import bcrypt from "bcryptjs";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string;
  isPlatformAdmin: boolean;
  authMethod?: "password_only" | "biometric_only" | "biometric_password";
  phone?: string;
  lastLoginAt?: string;
  subscriptionStatus?: string;
  subscriptionTrialEndsAt?: string | null;
}

export interface LoginMeta {
  previousLoginAt: string | null;
  subscriptionStatus: string | null;
  subscriptionTrialEndsAt: string | null;
}

export class AuthService {
  static async generateToken(userId: string): Promise<string> {
    return edgeGenerateToken(userId);
  }

  static async verifyToken(token: string): Promise<{ userId: string } | null> {
    const payload = await edgeVerifyToken(token);
    return payload ? { userId: payload.userId } : null;
  }

  static async login(email: string, password: string): Promise<{ user: UserProfile; token: string; meta: LoginMeta } | null> {
    try {
      const cleanEmail = email.trim().toLowerCase();

      const user = await db.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!user) {
        console.log("Login failed: User not found", cleanEmail);
        return null;
      }

      if (!user.active) {
        console.log("Login failed: User inactive");
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        console.log("Login failed: Invalid password");
        return null;
      }

      const previousLoginAt = user.lastLoginAt ? user.lastLoginAt.toISOString() : null;
      const now = new Date();

      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: now },
      });

      const subscription = await db.subscription.findFirst({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          trialEndsAt: true,
        },
      });

      const userProfile: UserProfile = {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        companyId: user.companyId,
        isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
        authMethod: (user as any).authMethod || "password_only",
        phone: user.phone || undefined,
        lastLoginAt: now.toISOString(),
        subscriptionStatus: subscription?.status || undefined,
        subscriptionTrialEndsAt: subscription?.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
      };

      const token = await this.generateToken(userProfile.id);
      return {
        user: userProfile,
        token,
        meta: {
          previousLoginAt,
          subscriptionStatus: subscription?.status || null,
          subscriptionTrialEndsAt: subscription?.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  }

  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.active) return null;

      const subscription = await db.subscription.findFirst({
        where: { companyId: user.companyId },
        orderBy: { createdAt: "desc" },
        select: {
          status: true,
          trialEndsAt: true,
        },
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        companyId: user.companyId,
        isPlatformAdmin: Boolean((user as any).isPlatformAdmin),
        authMethod: (user as any).authMethod || "password_only",
        phone: user.phone || undefined,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : undefined,
        subscriptionStatus: subscription?.status || undefined,
        subscriptionTrialEndsAt: subscription?.trialEndsAt ? subscription.trialEndsAt.toISOString() : null,
      };
    } catch (e) {
      console.error("Get user error:", e);
      return null;
    }
  }
}
