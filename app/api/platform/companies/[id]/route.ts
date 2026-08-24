import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";

/**
 * PUT /api/platform/companies/[id]
 * Update company details (Super Admin only)
 */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify super admin
    const user = await checkAuth();
    if (!user || !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, active } = body;

    // Validate at least one field to update
    if (name === undefined && active === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Check if company exists
    const existingCompany = await db.company.findUnique({
      where: { id: params.id },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Update company
    const updatedCompany = await db.company.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(active !== undefined && { active }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        company: updatedCompany,
        message: "Company updated successfully",
      },
    });

  } catch (error) {
    console.error("Platform update company error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/platform/companies/[id]
 * Delete company (Super Admin only)
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verify super admin
    const user = await checkAuth();
    if (!user || !user.isPlatformAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if company exists
    const company = await db.company.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if company has users or projects
    if (company._count.users > 0 || company._count.projects > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete company with active users or projects",
          details: {
            userCount: company._count.users,
            projectCount: company._count.projects,
          },
        },
        { status: 400 }
      );
    }

    // Delete company in transaction
    await db.$transaction(async (tx) => {
      // Delete any associated subscriptions
      await tx.subscription.deleteMany({
        where: { companyId: params.id },
      });

      // Delete the company
      await tx.company.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
    });

  } catch (error) {
    console.error("Platform delete company error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
