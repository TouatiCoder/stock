import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRoles } from "@/lib/backlog/security";
import { buildLinkedProjectWhere } from "@/lib/calculators/project-link";

const TOOL_TYPES = new Set(["concrete", "steel", "formwork", "mesh"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Resolves the optional project a calculation is linked to. Scoped to the
 * authenticated user's company - the same scope the calculators' project
 * dropdown offers - so any project the user can pick can also be saved
 * against, and a project of another company never resolves.
 */
async function resolveAuthorizedProjectId(params: {
  projectId?: string | null;
  role: string;
  userId: string;
  companyId: string;
}) {
  if (!params.projectId) return null;

  const project = await db.project.findFirst({
    where: buildLinkedProjectWhere({ projectId: params.projectId, companyId: params.companyId }),
    select: { id: true },
  });

  return project?.id ?? null;
}

export async function GET(req: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const url = new URL(req.url);
  const toolType = (url.searchParams.get("type") || "").trim().toLowerCase();
  const projectId = (url.searchParams.get("projectId") || "").trim();

  if (toolType && !TOOL_TYPES.has(toolType)) {
    return NextResponse.json({ error: "Invalid tool type" }, { status: 400 });
  }

  let allowedProjectId: string | null = null;
  if (projectId) {
    allowedProjectId = await resolveAuthorizedProjectId({
      projectId,
      role: auth.user.role,
      userId: auth.user.id,
      companyId: auth.user.companyId,
    });
    if (!allowedProjectId) {
      return NextResponse.json({ error: "Forbidden project access" }, { status: 403 });
    }
  }

  const rows = await db.toolCalculation.findMany({
    where: {
      companyId: auth.user.companyId,
      userId: auth.user.id,
      ...(toolType ? { toolType } : {}),
      ...(allowedProjectId ? { projectId: allowedProjectId } : {}),
    },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({
    items: rows.map((row) => ({
      id: row.id,
      toolType: row.toolType,
      input: row.inputJson,
      output: row.outputJson,
      notes: row.notes,
      project: row.project,
      createdAt: row.createdAt,
    })),
  }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } });
}

export async function POST(req: Request) {
  const auth = await requireRoles(["site_manager", "structural_engineer"]);
  if (auth.error || !auth.user) return auth.error;

  const body = await req.json().catch(() => ({}));
  const toolType = String(body?.toolType || "")
    .trim()
    .toLowerCase();
  const notes = typeof body?.notes === "string" ? body.notes.trim() : null;
  const input = body?.input;
  const output = body?.output;
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : null;

  if (!TOOL_TYPES.has(toolType)) {
    return NextResponse.json({ error: "Invalid tool type" }, { status: 400 });
  }
  if (!isPlainObject(input) || !isPlainObject(output)) {
    return NextResponse.json({ error: "input and output must be JSON objects" }, { status: 400 });
  }

  const authorizedProjectId = await resolveAuthorizedProjectId({
    projectId,
    role: auth.user.role,
    userId: auth.user.id,
    companyId: auth.user.companyId,
  });

  if (projectId && !authorizedProjectId) {
    return NextResponse.json({ error: "Forbidden project access" }, { status: 403 });
  }

  const created = await db.toolCalculation.create({
    data: {
      companyId: auth.user.companyId,
      userId: auth.user.id,
      projectId: authorizedProjectId,
      toolType,
      inputJson: input as Prisma.InputJsonValue,
      outputJson: output as Prisma.InputJsonValue,
      notes: notes || null,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      toolType: true,
      inputJson: true,
      outputJson: true,
      notes: true,
      projectId: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      id: created.id,
      toolType: created.toolType,
      input: created.inputJson,
      output: created.outputJson,
      notes: created.notes,
      projectId: created.projectId,
      createdAt: created.createdAt,
    },
    { status: 201 },
  );
}
