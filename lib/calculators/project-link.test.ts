import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  buildLinkedProjectWhere,
  buildToolProjectsUrl,
  buildToolProjectsWhere,
  formatProjectOptionLabel,
  mapToolProjectOptions,
  normalizeProjectSelection,
  PROJECT_NONE_VALUE,
  TOOL_PROJECTS_ENDPOINT,
} from "./project-link";

describe("project dropdown - loading", () => {
  test("the calculator asks the projects endpoint for the company scope", () => {
    // Client feedback: the dropdown was empty because the default (assigned)
    // scope hides every project the user is not personally assigned to.
    assert.equal(buildToolProjectsUrl(), `${TOOL_PROJECTS_ENDPOINT}?scope=company`);
    assert.equal(buildToolProjectsUrl("company"), `${TOOL_PROJECTS_ENDPOINT}?scope=company`);
    assert.equal(buildToolProjectsUrl("assigned"), `${TOOL_PROJECTS_ENDPOINT}?scope=assigned`);
  });

  test("company scope lists every project of the authenticated company", () => {
    const where = buildToolProjectsWhere({
      companyId: "company-1",
      userId: "user-1",
      role: "structural_engineer",
      scope: "company",
    });
    assert.deepEqual(where, { companyId: "company-1" });
  });

  test("the default (assigned) scope is unchanged for the other callers", () => {
    assert.deepEqual(
      buildToolProjectsWhere({ companyId: "c1", userId: "u1", role: "structural_engineer", scope: null }),
      { companyId: "c1", structuralEngineerId: "u1" },
    );
    assert.deepEqual(buildToolProjectsWhere({ companyId: "c1", userId: "u1", role: "site_manager" }), {
      companyId: "c1",
      siteManagerId: "u1",
    });
  });

  test("projects are always company-filtered, whatever the scope", () => {
    for (const scope of ["company", "assigned", null, "", "everything"]) {
      const where = buildToolProjectsWhere({
        companyId: "company-1",
        userId: "user-1",
        role: "site_manager",
        scope,
      });
      assert.equal(
        (where as { companyId: string }).companyId,
        "company-1",
        `scope=${scope} must stay scoped to the user's company`,
      );
    }
  });

  test("a project can only be linked when it belongs to the user's company", () => {
    assert.deepEqual(buildLinkedProjectWhere({ projectId: "p1", companyId: "company-1" }), {
      id: "p1",
      companyId: "company-1",
    });
  });
});

describe("project dropdown - response mapping", () => {
  test("maps the API payload to dropdown options", () => {
    const options = mapToolProjectOptions({
      items: [
        { id: "p1", name: "Villa Marina", status: "in_progress" },
        { id: "p2", name: "Residence Al Fath", status: "planning" },
        { id: "p3", name: "Showroom Industriel", status: "planning" },
      ],
    });
    assert.equal(options.length, 3);
    assert.deepEqual(
      options.map((o) => o.name),
      ["Villa Marina", "Residence Al Fath", "Showroom Industriel"],
    );
    assert.equal(formatProjectOptionLabel(options[0]), "Villa Marina (in_progress)");
  });

  test("a project without a status still renders a usable label", () => {
    const [option] = mapToolProjectOptions({ items: [{ id: "p1", name: "Villa Marina" }] });
    assert.equal(option.status, "");
    assert.equal(formatProjectOptionLabel(option), "Villa Marina");
  });

  test("malformed or empty payloads produce an empty list, never a crash", () => {
    assert.deepEqual(mapToolProjectOptions({ items: [] }), []);
    assert.deepEqual(mapToolProjectOptions({}), []);
    assert.deepEqual(mapToolProjectOptions(null), []);
    assert.deepEqual(mapToolProjectOptions({ items: "nope" }), []);
    assert.deepEqual(
      mapToolProjectOptions({ items: [null, 42, { id: "", name: "x" }, { id: "p1", name: "  " }] }),
      [],
    );
  });

  test("an empty company project list is a real state the UI can message", () => {
    const options = mapToolProjectOptions({ items: [] });
    assert.equal(options.length, 0);
    // The client renders `concreteNoProjectsAvailable` when this list is empty
    // and loading has finished, instead of an empty dropdown.
  });
});

describe("project link stays optional", () => {
  test("no selection means no project, not a validation error", () => {
    assert.equal(normalizeProjectSelection(""), null);
    assert.equal(normalizeProjectSelection(null), null);
    assert.equal(normalizeProjectSelection(undefined), null);
    assert.equal(normalizeProjectSelection(PROJECT_NONE_VALUE), null);
    assert.equal(normalizeProjectSelection("   "), null);
  });

  test("a selected project is passed through unchanged", () => {
    assert.equal(normalizeProjectSelection("p1"), "p1");
    assert.equal(normalizeProjectSelection(" p1 "), "p1");
  });

  test("the sentinel value is never mistaken for a project id", () => {
    assert.notEqual(PROJECT_NONE_VALUE, "");
    assert.equal(normalizeProjectSelection(PROJECT_NONE_VALUE), null);
  });
});
