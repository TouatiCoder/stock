import { NextResponse } from "next/server";
import { getDb } from "@/lib/mysql/connection";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { material_id, quantity, companyId } = body;

    if (!material_id || !quantity) {
      return NextResponse.json({ error: "Material and Quantity are required" }, { status: 400 });
    }

    const db = getDb();
    
    // Check if inventory exists for this material
    const existing = await db.query(
        `SELECT id, quantity FROM inventory WHERE material_id = ? LIMIT 1`,
        [material_id]
    );

    if (existing.rows.length > 0) {
        const inv = existing.rows[0];
        const newQuantity = Number(inv.quantity) + Number(quantity);
        
        await db.query(
            `UPDATE inventory SET quantity = ?, updated_at = NOW() WHERE id = ?`,
            [newQuantity, inv.id]
        );
        return NextResponse.json({ success: true, message: "Inventory updated", id: inv.id });
    } else {
        if (!companyId) {
             return NextResponse.json({ error: "Company ID required for new inventory" }, { status: 400 });
        }
        
        const result = await db.query(
            `INSERT INTO inventory (id, material_id, quantity, company_id, created_at, updated_at) 
             VALUES (UUID(), ?, ?, ?, NOW(), NOW())`,
            [material_id, quantity, companyId]
        );
        return NextResponse.json({ success: true, message: "Inventory created", id: result.insertId });
    }

  } catch (error) {
    console.error("Error updating inventory:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
