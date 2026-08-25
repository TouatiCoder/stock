"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  ArrowLeftRight,
  PackagePlus,
  ArrowRightLeft,
  Boxes,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

import { InventoryStats } from "@/components/inventory/inventory-stats"
import { InventoryList } from "@/components/inventory/inventory-list"

import {
  useInventoryTranslations,
  useCommonTranslations,
} from "@/components/LocaleProvider"

export default function InventoryPageClient() {
  const [searchTerm, setSearchTerm] = useState("")

  const tInventory = useInventoryTranslations()
  const tCommon = useCommonTranslations()

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
            <Boxes className="h-6 w-6 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {tInventory("title")}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {tInventory("title")}
            </p>
          </div>

        </div>

        {/* =======================================================
            ACTIONS
        ======================================================= */}

        <div className="flex flex-col sm:flex-row gap-2">

          {/* STOCK ENTRY */}

          <Link
            href="/inventory/entry/new"
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto"
            >
              <PackagePlus className="me-2 h-4 w-4" />

              {tInventory("stockEntry")}
            </Button>
          </Link>

          {/* STOCK TRANSFER */}

          <Link
            href="/stock/consumption/new"
            className="w-full sm:w-auto"
          >
            <Button
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeftRight className="me-2 h-4 w-4" />

              {tInventory("stockTransfer")}
            </Button>
          </Link>

          {/* NEW MATERIAL */}

          <Link
            href="/inventory/materials/new"
            className="w-full sm:w-auto"
          >
            <Button className="w-full sm:w-auto">
              <Plus className="me-2 h-4 w-4" />

              {tInventory("newMaterial")}
            </Button>
          </Link>

        </div>
      </div>

      {/* =========================================================
          INVENTORY STATS
      ========================================================= */}

      <InventoryStats />

      {/* =========================================================
          SEARCH
      ========================================================= */}

      <Card>
        <div className="p-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />

            <Input
              type="search"
              placeholder={tCommon(
                "searchMaterialPlaceholder"
              )}
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              className="ps-10 h-11"
              aria-label={tCommon(
                "searchMaterialPlaceholder"
              )}
            />

          </div>

        </div>
      </Card>

      {/* =========================================================
          INVENTORY LIST
      ========================================================= */}

      <InventoryList
        searchTerm={searchTerm}
      />

    </div>
  )
}