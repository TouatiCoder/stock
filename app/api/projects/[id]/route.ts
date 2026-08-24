import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkAuth } from "@/lib/auth/auth-utils";
import { hasPermission, type UserRole } from "@/lib/permissions";
import { Prisma } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        siteManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        structuralEngineer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Verify company access
    if (project.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    const body = await req.json();

    // Verify project exists and belongs to user's company
    const existingProject = await db.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existingProject.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized update" }, { status: 403 });
    }

    // Extract fields to update
    const {
      name,
      description,
      clientName,
      clientEmail,
      clientPhone,
      address,
      city,
      postalCode,
      projectType,
      status,
      totalBudget,
      startDate,
      endDate,
      siteManagerId,
      structuralEngineerId,
    } = body;

    const parsedTotalBudget =
      typeof totalBudget === "number"
        ? totalBudget
        : totalBudget === null || totalBudget === undefined || totalBudget === ""
          ? null
          : Number(totalBudget);

    if (parsedTotalBudget !== null && Number.isNaN(parsedTotalBudget)) {
      return NextResponse.json({ error: "Invalid total budget value" }, { status: 400 });
    }

    const updateData = {
      name,
      description,
      clientName,
      clientEmail,
      clientPhone,
      address,
      city,
      postalCode,
      projectType,
      status,
      totalBudget: parsedTotalBudget,
      startDate: startDate ? new Date(startDate) : (startDate === null ? null : undefined),
      endDate: endDate ? new Date(endDate) : (endDate === null ? null : undefined),
      siteManagerId,
      structuralEngineerId,
      updatedAt: new Date(),
    };

    const updatedProject = await db.project.update({
      where: { id },
      // Cast to any to avoid transient TS type mismatch when Prisma Client types lag behind the schema
      data: updateData as any,
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error (${error.code})`, details: error.message },
        { status: 500 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(user.role as UserRole, "delete_project")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const project = await db.project.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.companyId !== user.companyId) {
      return NextResponse.json({ error: "Unauthorized access to this project" }, { status: 403 });
    }

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json(
        { error: "This project cannot be deleted because it has associated records." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
