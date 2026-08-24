import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { randomUUID } from "crypto";

/**
 * POST /api/platform/companies
 * Create a new company (Super Admin only)
 */
export async function POST(req: Request) {
  try {
    // Verify super admin
    const user = await checkAuth();
    if (!user || !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, email, adminName, planCode = "free" } = body;

    // Validate required fields
    if (!name || !email || !adminName) {
      return NextResponse.json(
        { error: "Company name, admin email, and admin name are required" },
        { status: 400 }
      );
    }

    // Check if company already exists
    const existingCompany = await db.company.findUnique({
      where: { id: name.toLowerCase().replace(/\s+/g, "-") },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Company ID already exists" },
        { status: 400 }
      );
    }

    const companyId = randomUUID();

    // Create company and admin user in transaction
    const result = await db.$transaction(async (tx) => {
      // Create company
      await tx.company.create({
        data: {
          id: companyId,
          name: name.trim(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create admin user
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const adminUser = await tx.user.create({
        data: {
          id: randomUUID(),
          email: email.trim().toLowerCase(),
          firstName: adminName.trim().split(' ')[0],
          lastName: adminName.trim().split(' ').slice(1).join(' ') || 'Admin',
          password: tempPassword,
          role: "admin",
          companyId: companyId,
          active: true,
          updatedAt: new Date(),
        },
      });

      return { companyId, adminEmail: adminUser.email, tempPassword };
    });

    return NextResponse.json({
      success: true,
      data: {
        companyId: result.companyId,
        adminEmail: result.adminEmail,
        tempPassword: result.tempPassword,
        message: "Company created successfully. Temporary password provided.",
      },
    });

  } catch (error) {
    console.error("Platform create company error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
