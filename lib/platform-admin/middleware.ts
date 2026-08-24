import { NextResponse } from "next/server";
import { checkAuth } from "@/lib/auth/auth-utils";

export async function requirePlatformAdmin() {
  const user = await checkAuth();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      user: null,
    };
  }

  if (!user.isPlatformAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      user: null,
    };
  }

  return { error: null as NextResponse<unknown> | null, user };
}

