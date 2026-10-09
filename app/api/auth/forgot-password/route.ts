import { NextResponse } from "next/server";

/**
 * TEMPORARY: Resend password-reset emails are disabled while deployment is being verified.
 * To re-enable later:
 * 1. Restore the database/token and Resend email logic.
 * 2. Configure RESEND_API_KEY and the sender/app URL in Vercel Environment Variables.
 * 3. Test the complete password-reset flow before enabling it in production.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Password reset by email is temporarily unavailable. Please try again later." },
    { status: 503 }
  );
}
