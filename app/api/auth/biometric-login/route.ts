import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Deprecated endpoint. Use /api/auth/webauthn/authenticate/verify instead." },
    { status: 410 }
  );
}
