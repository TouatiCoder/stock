import { createClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/utils/auth"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          ...body,
          created_by: user.id,
        },
      ])
      .select()

    if (error) throw error

    await supabase.from("audit_logs").insert([
      {
        user_id: user.id,
        action: "Expense recorded",
        entity_type: "expense",
        entity_id: data[0].id,
      },
    ])

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
