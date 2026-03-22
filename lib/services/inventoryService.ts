export interface InventoryStats {
  totalMaterials: number
  totalValue: number
  lowStockCount: number
  criticalStockCount: number
  outOfStockCount: number
  recentMovements: number
  categoriesCount: number
}

export interface StockMovement {
  id: string
  reference: string
  movementType: "in" | "out" | "transfer" | "return" | "adjustment" | "consumption"
  materialId: string
  quantity: number
  unitPrice?: number
  totalValue?: number
  sourceType?: "supplier" | "warehouse" | "project" | "adjustment"
  sourceId?: string
  destinationType?: "warehouse" | "project" | "supplier" | "scrap"
  destinationId?: string
  projectId?: string
  userId: string
  notes?: string
  movementDate: Date
  createdAt: Date
}

export const inventoryService = {
  async getInventoryStats(companyId: string): Promise<InventoryStats> {
    const params = new URLSearchParams({ companyId })
    const response = await fetch(`/api/materials?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch inventory stats")
    }

    const materials: any[] = await response.json()
    const safeMaterials = Array.isArray(materials) ? materials : []

    let totalValue = 0
    let lowStockCount = 0
    let criticalStockCount = 0
    let outOfStockCount = 0
    const categories = new Set<string>()

    for (const material of safeMaterials) {
      const currentStock = Number(material.current_stock ?? 0)
      const unitPrice = Number(material.unit_price ?? 0)
      const minStock = Number(material.min_stock_level ?? 0)
      const criticalThreshold = Number(material.critical_threshold ?? 0)

      totalValue += currentStock * unitPrice

      if (currentStock <= 0) outOfStockCount += 1
      if (currentStock <= criticalThreshold) {
        criticalStockCount += 1
      } else if (currentStock <= minStock) {
        lowStockCount += 1
      }

      const categoryName = material.category?.name || material.category_name || material.category
      if (categoryName) categories.add(String(categoryName))
    }

    return {
      totalMaterials: safeMaterials.length,
      totalValue,
      lowStockCount,
      criticalStockCount,
      outOfStockCount,
      recentMovements: 0,
      categoriesCount: categories.size,
    }
  },

  async getAllMaterials(
    companyId: string,
    filters?: {
      search?: string
      categoryId?: string
      lowStock?: boolean
      criticalStock?: boolean
    },
  ) {
    console.warn("inventoryService.getAllMaterials: Not implemented with Prisma yet", companyId, filters)
    return []
  },

  async getCategories(companyId: string) {
    console.warn("inventoryService.getCategories: Not implemented with Prisma yet", companyId)
    return []
  },

  async getRecentStockMovements(companyId: string, limit: number = 10) {
    console.warn("inventoryService.getRecentStockMovements: Not implemented with Prisma yet", companyId, limit)
    return []
  },

  async getCriticalThresholds(companyId: string) {
    console.warn("inventoryService.getCriticalThresholds: Not implemented with Prisma yet", companyId)
    return []
  },

  async createStockMovement(movementData: Partial<StockMovement>) {
    console.warn("inventoryService.createStockMovement: Not implemented with Prisma yet", movementData)
    return {} as any
  },

  async updateMaterialStock(materialId: string, quantity: number, movementType: "in" | "out" | "adjustment") {
    console.warn("inventoryService.updateMaterialStock: Not implemented with Prisma yet", materialId, quantity, movementType)
    return {} as any
  },

  async generateInventoryReport(companyId: string) {
    console.warn("inventoryService.generateInventoryReport: Not implemented with Prisma yet", companyId)
    return []
  },
}
