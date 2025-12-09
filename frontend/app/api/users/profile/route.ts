import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/utils/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    const { error } = await supabase
      .from("users")
      .update({
        full_name: body.full_name,
        phone: body.phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 500 })
  }
}
