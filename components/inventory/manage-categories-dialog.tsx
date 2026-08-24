"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColorPicker } from "@/components/ui/color-picker"
import { Pencil, Trash2, Check, X, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useInventoryTranslations } from "@/components/LocaleProvider"

interface Category {
  id: string
  name: string
  color_code: string
}

interface ManageCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  companyId: string
  onCategoriesChange: (categories: Category[]) => void
  onCategoryDeleted?: (deletedName: string) => void
  onAllReset?: () => void
  getCategoryColors: (companyId: string) => Record<string, string>
  saveCategoryColor: (companyId: string, name: string, color: string) => void
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  categories,
  companyId,
  onCategoriesChange,
  onCategoryDeleted,
  onAllReset,
  getCategoryColors,
  saveCategoryColor,
}: ManageCategoriesDialogProps) {
  const tInventory = useInventoryTranslations()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("#3B82F6")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  const startEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color_code || "#3B82F6")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditColor("#3B82F6")
  }

  const handleSaveEdit = async (cat: Category) => {
    const trimmedName = editName.trim()
    if (!trimmedName) return

    try {
      setLoadingId(cat.id)

      if (trimmedName !== cat.name) {
        const res = await fetch("/api/inventory/categories", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldName: cat.name, newName: trimmedName }),
        })
        if (!res.ok) throw new Error("Failed to rename category")
      }

      // Update localStorage colors
      const colors = getCategoryColors(companyId)
      if (trimmedName !== cat.name) {
        delete colors[cat.name]
      }
      saveCategoryColor(companyId, trimmedName, editColor)

      const updated = categories.map((c) =>
        c.id === cat.id
          ? { ...c, id: trimmedName, name: trimmedName, color_code: editColor }
          : c
      )
      onCategoriesChange(updated)
      toast.success(tInventory("categoryUpdated"))
      cancelEdit()
    } catch {
      toast.error(tInventory("genericUpdateError"))
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = async (cat: Category) => {
    const msg = tInventory("deleteCategoryConfirm").replace("{{name}}", cat.name)
    if (!confirm(msg)) return

    try {
      setLoadingId(cat.id)
      const res = await fetch(`/api/inventory/categories?name=${encodeURIComponent(cat.name)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete category")

      // Remove from localStorage
      const colors = getCategoryColors(companyId)
      delete colors[cat.name]
      localStorage.setItem(`categoryColors_${companyId}`, JSON.stringify(colors))

      const updated = categories.filter((c) => c.id !== cat.id)
      onCategoriesChange(updated)
      onCategoryDeleted?.(cat.name)
      toast.success(tInventory("categoryDeleted"))
    } catch {
      toast.error(tInventory("categoryDeleteError"))
    } finally {
      setLoadingId(null)
    }
  }

  const handleResetAll = async () => {
    if (!confirm(tInventory("resetAllCategoriesConfirm"))) return

    try {
      setResetting(true)
      const res = await fetch("/api/inventory/categories", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to reset categories")

      localStorage.removeItem(`categoryColors_${companyId}`)
      onCategoriesChange([])
      onAllReset?.()
      toast.success(tInventory("allCategoriesReset"))
      onOpenChange(false)
    } catch {
      toast.error(tInventory("categoriesResetError"))
    } finally {
      setResetting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{tInventory("manageCategoriesTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {tInventory("noCategoriesYet")}
            </p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="border rounded-lg overflow-hidden">
                {editingId === cat.id ? (
                  <div className="p-3 space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") cancelEdit()
                      }}
                      disabled={loadingId === cat.id}
                      autoFocus
                    />
                    <ColorPicker
                      value={editColor}
                      onChange={setEditColor}
                      disabled={loadingId === cat.id}
                    />
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => handleSaveEdit(cat)}
                        disabled={loadingId === cat.id || !editName.trim()}
                      >
                        {loadingId === cat.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={loadingId === cat.id}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color_code || "#9CA3AF" }}
                    />
                    <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                    <button
                      onClick={() => startEdit(cat)}
                      disabled={loadingId === cat.id}
                      className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title={tInventory("renameCategory")}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={loadingId === cat.id}
                      className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                      title={tInventory("actionDelete")}
                    >
                      {loadingId === cat.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t">
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={handleResetAll}
            disabled={resetting || categories.length === 0}
          >
            {resetting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RotateCcw size={14} />
            )}
            {tInventory("resetAllCategories")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
