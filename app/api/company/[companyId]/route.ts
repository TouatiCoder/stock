// app/api/company/[companyId]/route.ts
import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, email')
      .eq('id', params.companyId)
      .single()

    if (error) throw error

    return NextResponse.json(company)
  } catch (error) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 }
    )
  }
}