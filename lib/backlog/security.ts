import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";

export type BacklogRole = "admin" | "site_manager" | "structural_engineer";

export function isRoleAllowed(role: string | null | undefined, allowedRoles: BacklogRole[]): boolean {
  if (!role) return false;
  return allowedRoles.includes(role as BacklogRole);
}

export async function requireRoles(allowedRoles: BacklogRole[]) {
  const user = await checkAuth();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  if (!isRoleAllowed(user.role, allowedRoles)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return {
    error: null as NextResponse<unknown> | null,
    user,
  };
}

export function assertStatusTransition(current: string, next: string, allowed: Record<string, string[]>) {
  const allowedTargets = allowed[current] || [];
  if (!allowedTargets.includes(next)) {
    throw new Error(`Invalid status transition: ${current} -> ${next}`);
  }
}
