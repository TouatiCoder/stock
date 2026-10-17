import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { hasPermission, type UserRole } from "@/lib/permissions";

function canManageSuppliers(user: { role: string }) {
  return hasPermission(user.role as UserRole, "view_costs");
}

function cleanOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET() {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 });

    const suppliers = await db.supplier.findMany({
      where: { companyId: user.companyId, isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSuppliers(user)) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    if (!user.companyId) return NextResponse.json({ error: "Company ID required" }, { status: 400 });

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Le nom du fournisseur est obligatoire." }, { status: 400 });
    if (name.length > 255) return NextResponse.json({ error: "Le nom ne peut pas dépasser 255 caractères." }, { status: 400 });

    const supplier = await db.supplier.create({
      data: {
        name,
        contactPerson: cleanOptional(body.contactPerson),
        email: cleanOptional(body.email),
        phone: cleanOptional(body.phone),
        address: cleanOptional(body.address),
        companyId: user.companyId,
        isActive: true,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(supplier, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "Impossible de créer le fournisseur." }, { status: 500 });
  }
}
