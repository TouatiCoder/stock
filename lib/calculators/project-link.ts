/**
 * Shared helpers for the optional "Lier au projet (optionnel)" dropdown used by
 * the calculators.
 *
 * Client feedback: the dropdown was always empty. Root cause: the calculator
 * called /api/tools/projects with no `scope`, and that default filters projects
 * on `structuralEngineerId` / `siteManagerId` = current user. Both columns are
 * nullable, so every project of the company that has no assignee (or that is
 * assigned to a colleague) was hidden. The calculator must list the projects of
 * the authenticated user's company, so it now asks for the company scope
 * explicitly - and never for another company: `companyId` is always part of the
 * server-side filter, whatever the scope.
 */

export type ToolProjectScope = "company" | "assigned";

export interface ToolProjectOption {
  id: string;
  name: string;
  status: string;
}

/** Sentinel used by the Radix <Select>, which cannot hold an empty item value. */
export const PROJECT_NONE_VALUE = "__none__";

export const TOOL_PROJECTS_ENDPOINT = "/api/tools/projects";

/**
 * URL the calculator fetches its project options from: every project of the
 * authenticated user's company, not only the ones they are assigned to.
 */
export function buildToolProjectsUrl(scope: ToolProjectScope = "company"): string {
  return `${TOOL_PROJECTS_ENDPOINT}?scope=${scope}`;
}

/**
 * Prisma `where` for the project list. `companyId` is unconditional: a user can
 * never see, or link to, a project belonging to another company.
 */
export function buildToolProjectsWhere(params: {
  companyId: string;
  userId: string;
  role: string;
  scope?: string | null;
}) {
  const base = { companyId: params.companyId };
  if (params.scope === "company") return base;
  return {
    ...base,
    ...(params.role === "structural_engineer"
      ? { structuralEngineerId: params.userId }
      : { siteManagerId: params.userId }),
  };
}

/**
 * Prisma `where` used to authorize the optional project a calculation is linked
 * to. Company-scoped, to stay consistent with what the dropdown offers: any
 * project the user can pick they can also save against, and nothing outside
 * their company is ever resolvable.
 */
export function buildLinkedProjectWhere(params: { projectId: string; companyId: string }) {
  return { id: params.projectId, companyId: params.companyId };
}

/** Maps the API payload to dropdown options, dropping anything malformed. */
export function mapToolProjectOptions(body: unknown): ToolProjectOption[] {
  const items = (body as { items?: unknown } | null | undefined)?.items;
  if (!Array.isArray(items)) return [];

  return items.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { id, name, status } = item as Record<string, unknown>;
    if (typeof id !== "string" || id === "") return [];
    if (typeof name !== "string" || name.trim() === "") return [];
    return [{ id, name, status: typeof status === "string" ? status : "" }];
  });
}

/** Label shown in the dropdown for one project. */
export function formatProjectOptionLabel(project: ToolProjectOption): string {
  return project.status ? `${project.name} (${project.status})` : project.name;
}

/**
 * Linking a calculation to a project is optional: "no project" and the empty
 * value both mean "save without a project", never a validation error.
 */
export function normalizeProjectSelection(value: string | null | undefined): string | null {
  if (!value || value === PROJECT_NONE_VALUE) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}
