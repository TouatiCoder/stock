import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/platform-admin/middleware";
import { enforceSimpleRateLimit } from "@/lib/platform-admin/rate-limit";

const RATE_LIMIT_MAX = Number(process.env.PLATFORM_METRICS_RATE_LIMIT_MAX || "60");
const RATE_LIMIT_WINDOW_MS = Number(process.env.PLATFORM_METRICS_RATE_LIMIT_WINDOW_MS || "60000");

export async function requirePlatformAdminWithRateLimit(req: Request, scope: string) {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) {
    return { error: auth.error, user: null };
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${scope}:${auth.user.id}:${forwardedFor}`;
  const limit = enforceSimpleRateLimit({
    key,
    max: Number.isFinite(RATE_LIMIT_MAX) && RATE_LIMIT_MAX > 0 ? RATE_LIMIT_MAX : 60,
    windowMs: Number.isFinite(RATE_LIMIT_WINDOW_MS) && RATE_LIMIT_WINDOW_MS > 0 ? RATE_LIMIT_WINDOW_MS : 60000,
  });

  if (!limit.allowed) {
    return {
      error: NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((limit.retryAfterMs || 0) / 1000)),
          },
        },
      ),
      user: null,
    };
  }

  return {
    error: null as NextResponse<unknown> | null,
    user: auth.user,
  };
}
