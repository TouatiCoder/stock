import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/utils/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "ingenieur_structure"])
    const supabase = await createClient()

    const { data, error } = await supabase.from("calculations").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(["admin", "ingenieur_structure"])
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("calculations")
      .insert([
        {
          ...body,
          created_by: user.id,
        },
      ])
      .select()

    if (error) throw error

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
