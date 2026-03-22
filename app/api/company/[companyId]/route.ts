import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { cookies } from "next/headers";

async function checkAuth(companyId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.companyId !== companyId) return null;

  return user;
}

type Props = {
  params: Promise<{ companyId: string }>;
};

export async function GET(_req: Request, { params }: Props) {
  try {
    const { companyId } = await params;

    const user = await checkAuth(companyId);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Fetch company error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Props) {
  try {
    const { companyId } = await params;

    const user = await checkAuth(companyId);
    if (!user || !["admin", "site_manager"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();

    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        name: body.name,
        email: user.email ?? body.email,
        siret: body.siret,
        phone: body.phone,
        address: body.address,
        city: body.city,
        postalCode: body.postal_code,
        taxRate: body.tax_rate ? parseFloat(body.tax_rate) : null,
        bankInfo: body.bank_info,
        ice: body.ice,
        if_id: body.if,
        country: body.country,
        currency: body.currency,
        timezone: body.timezone,
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Update company error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
