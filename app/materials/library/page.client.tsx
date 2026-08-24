"use client";

import { useEffect, useState } from "react";
import { useCommonTranslations, useInventoryTranslations, useLocale } from "@/components/LocaleProvider";

type MaterialRow = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unitPrice: number | null;
  category: string | null;
  supplier: { id: string; name: string } | null;
};

type Props = {
  isAdmin: boolean;
};

const defaultForm = {
  id: "",
  name: "",
  unit: "",
  unitPrice: "",
  category: "",
  description: "",
};

export default function MaterialsLibraryClient({ isAdmin }: Props) {
  const tCommon = useCommonTranslations();
  const tInventory = useInventoryTranslations();
  const { locale } = useLocale();
  const [items, setItems] = useState<MaterialRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadMaterials = async (params?: { search?: string; category?: string }) => {
    try {
      setIsLoading(true);
      setError(null);

      const qp = new URLSearchParams();
      const searchValue = params?.search ?? search;
      const categoryValue = params?.category ?? category;
      if (searchValue) qp.set("search", searchValue);
      if (categoryValue && categoryValue !== "all") qp.set("category", categoryValue);

      const res = await fetch(`/api/materials/library?${qp.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || tInventory("materialLibraryLoadError"));
      }

      setItems(body.items || []);
      setCategories(body.categories || []);
    } catch (err: any) {
      setError(err?.message || tInventory("materialLibraryLoadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const handleSearch = async () => {
    await loadMaterials({ search, category });
  };

  const resetForm = () => setForm(defaultForm);

  const handleSave = async () => {
    if (!isAdmin) return;
    try {
      setIsSaving(true);
      setError(null);
      setSaveMessage(null);

      if (!form.name.trim() || !form.unit.trim()) {
        throw new Error(tInventory("materialLibraryNameUnitRequired"));
      }

      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
        category: form.category.trim() || null,
        description: form.description.trim() || null,
      };

      const isEdit = Boolean(form.id);
      const endpoint = isEdit ? `/api/materials/library/${form.id}` : "/api/materials/library";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || tInventory("materialLibrarySaveError"));
      }

      setSaveMessage(isEdit ? tInventory("materialLibraryUpdated") : tInventory("materialLibraryCreated"));
      resetForm();
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || tInventory("materialLibrarySaveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (row: MaterialRow) => {
    if (!isAdmin) return;
    setForm({
      id: row.id,
      name: row.name,
      unit: row.unit,
      unitPrice: row.unitPrice != null ? String(row.unitPrice) : "",
      category: row.category || "",
      description: row.description || "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      setError(null);
      setSaveMessage(null);
      const res = await fetch(`/api/materials/library/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || tInventory("materialLibraryDeleteError"));
      }

      setSaveMessage(tInventory("materialLibraryDeleted"));
      if (form.id === id) resetForm();
      await loadMaterials();
    } catch (err: any) {
      setError(err?.message || tInventory("materialLibraryDeleteError"));
    }
  };

  const formatPrice = (value: number) =>
    value.toLocaleString(locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-MA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{tInventory("materialLibraryTitle")}</h1>
        <p className="text-sm text-gray-600">
          {tInventory("materialLibrarySubtitle")}
        </p>
      </div>

      {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {saveMessage && <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">{saveMessage}</div>}

      <div className="rounded border bg-white p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">{tInventory("materialLibraryFiltersTitle")}</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded border p-2"
            placeholder={tInventory("materialLibrarySearchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded border p-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{tInventory("materialLibraryAllCategories")}</option>
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
          <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={handleSearch}>
            {tInventory("materialLibraryApply")}
          </button>
        </div>
      </div>

      {isAdmin ? (
        <div className="rounded border bg-white p-4 space-y-3">
          <h2 className="font-semibold text-gray-900">
            {form.id ? tInventory("materialLibraryEditTitle") : tInventory("materialLibraryCreateTitle")}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded border p-2"
              placeholder={tCommon("name")}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="rounded border p-2"
              placeholder={tInventory("materialLibraryUnitPlaceholder")}
              value={form.unit}
              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
            />
            <input
              className="rounded border p-2"
              placeholder={tInventory("unitPrice")}
              value={form.unitPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, unitPrice: e.target.value }))}
            />
            <input
              className="rounded border p-2"
              placeholder={tInventory("category")}
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <textarea
            className="w-full rounded border p-2"
            rows={3}
            placeholder={tCommon("description")}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? tCommon("saving") : form.id ? tCommon("update") : tCommon("create")}
            </button>
            <button className="rounded border px-4 py-2" onClick={resetForm}>
              {tInventory("materialLibraryClear")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded border bg-white p-4">
        <h2 className="font-semibold text-gray-900">{tInventory("materials")}</h2>
        {isLoading ? <p className="mt-2 text-sm text-gray-500">{tCommon("loading")}</p> : null}
        {!isLoading && items.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">{tInventory("materialLibraryEmpty")}</p>
        ) : null}
        {!isLoading && items.length > 0 ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">{tCommon("name")}</th>
                  <th className="p-2">{tInventory("category")}</th>
                  <th className="p-2">{tInventory("unit")}</th>
                  <th className="p-2">{tInventory("unitPrice")}</th>
                  <th className="p-2">{tInventory("supplier")}</th>
                  {isAdmin ? <th className="p-2">{tCommon("actions")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="p-2">
                      <p className="font-medium text-gray-900">{row.name}</p>
                      {row.description ? <p className="text-xs text-gray-500">{row.description}</p> : null}
                    </td>
                    <td className="p-2">{row.category || "-"}</td>
                    <td className="p-2">{row.unit}</td>
                    <td className="p-2">{row.unitPrice != null ? formatPrice(row.unitPrice) : "-"}</td>
                    <td className="p-2">{row.supplier?.name || "-"}</td>
                    {isAdmin ? (
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className="rounded border px-2 py-1 text-xs" onClick={() => startEdit(row)}>
                            {tCommon("edit")}
                          </button>
                          <button className="rounded border border-red-300 px-2 py-1 text-xs text-red-700" onClick={() => handleDelete(row.id)}>
                            {tCommon("delete")}
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
