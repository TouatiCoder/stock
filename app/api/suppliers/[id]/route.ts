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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSuppliers(user)) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const existing = await db.supplier.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });

    const data: {
      name?: string;
      contactPerson?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      isActive?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json({ error: "Le nom du fournisseur est obligatoire." }, { status: 400 });
      }
      if (body.name.trim().length > 255) return NextResponse.json({ error: "Le nom ne peut pas dépasser 255 caractères." }, { status: 400 });
      data.name = body.name.trim();
    }
    if (body.contactPerson !== undefined) data.contactPerson = cleanOptional(body.contactPerson);
    if (body.email !== undefined) data.email = cleanOptional(body.email);
    if (body.phone !== undefined) data.phone = cleanOptional(body.phone);
    if (body.address !== undefined) data.address = cleanOptional(body.address);

    const supplier = await db.supplier.update({ where: { id }, data });
    return NextResponse.json(supplier, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "Impossible de modifier le fournisseur." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canManageSuppliers(user)) return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });

    const { id } = await params;
    const existing = await db.supplier.findFirst({ where: { id, companyId: user.companyId } });
    if (!existing) return NextResponse.json({ error: "Fournisseur introuvable." }, { status: 404 });

    // Soft-delete so historic purchase orders keep their supplier relation intact.
    await db.supplier.update({ where: { id }, data: { isActive: false, updatedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: "Impossible de supprimer le fournisseur." }, { status: 500 });
  }
}
