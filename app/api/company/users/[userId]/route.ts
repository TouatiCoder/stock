import { NextResponse } from "next/server";
import { getDb } from "@/lib/mysql/connection"; // Updated import to use MySQL connection
import { verifyToken } from "@/lib/utils/edge-jwt";
import { cookies } from "next/headers";

export async function DELETE(req: Request, { params }: { params: { userId: string } }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const currentUserResult = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [payload.userId]
    );
    
    if (currentUserResult.rows.length === 0) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const currentUser = currentUserResult.rows[0];

    // فقط الأدمن يمكنه الحذف
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // لا يمكن حذف نفسك
    if (currentUser.id.toString() === params.userId) {
      return NextResponse.json({ error: "Impossible de supprimer son propre compte" }, { status: 400 });
    }

    // First, verify the user exists and belongs to the same company
    const userToDeleteResult = await db.query(
      'SELECT * FROM users WHERE id = ?',
      [params.userId]
    );
    
    if (userToDeleteResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    
    const userToDelete = userToDeleteResult.rows[0];
    
    if (userToDelete.company_id?.toString() !== currentUser.company_id?.toString()) {
      return NextResponse.json({ error: "Vous ne pouvez pas supprimer un utilisateur d'une autre entreprise" }, { status: 403 });
    }
    
    // Try to delete the user
    try {
      await db.query(
        'UPDATE users SET active = 0, updated_at = NOW() WHERE id = ? AND company_id = ?',
        [params.userId, currentUser.company_id]
      );
    } catch (deleteError) {
      console.error('User deletion error:', deleteError);
      
      // Provide a more descriptive error message
      return NextResponse.json({ 
        error: "Impossible de supprimer l'utilisateur. Il se peut qu'il soit associé à des données critiques. Veuillez contacter un administrateur." 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}