import { db } from "@/lib/db"

type MovementActor = {
  companyId: string
  userId?: string | null
}

type StockEntryInput = MovementActor & {
  materialId: string
  warehouseId: string
  quantity: number
  notes?: string
}

type StockTransferInput = MovementActor & {
  materialId: string
  sourceWarehouseId: string
  destinationWarehouseId: string
  quantity: number
  notes?: string
}

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
    const materialIds = await db.material
      .findMany({ where: { companyId }, select: { id: true } })
      .then((rows) => rows.map((r) => r.id))

    const [inventoryRows, recentMovements] = await Promise.all([
      db.inventory.findMany({
        where: { companyId },
        include: { material: { select: { unitPrice: true, category: true } } },
      }),
      db.stockMovement.count({
        where: {
          materialId: { in: materialIds },
          movementDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    let totalValue = 0
    let lowStockCount = 0
    let criticalStockCount = 0
    const categories = new Set<string>()

    for (const row of inventoryRows) {
      const qty = Number(row.quantity)
      const price = Number(row.material.unitPrice ?? 0)
      const min = Number(row.minThreshold ?? 0)

      totalValue += qty * price

      // Aligns with inventory-list.tsx getStockStatus:
      // critical = qty <= 0, low = qty > 0 && qty <= min
      if (qty <= 0) criticalStockCount += 1
      else if (min > 0 && qty <= min) lowStockCount += 1

      if (row.material.category) categories.add(row.material.category)
    }

    return {
      totalMaterials: inventoryRows.length,
      totalValue,
      lowStockCount,
      criticalStockCount,
      outOfStockCount: criticalStockCount,
      recentMovements,
      categoriesCount: categories.size,
    }
  },

  async getAllMaterials(
    companyId: string,
    filters?: {
      search?: string
      category?: string
      supplierId?: string
      lowStock?: boolean
      criticalStock?: boolean
    },
  ) {
    const materials = await db.material.findMany({
      where: {
        companyId,
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search } },
            { description: { contains: filters.search } },
            { category: { contains: filters.search } },
            { supplier: { is: { name: { contains: filters.search } } } },
          ],
        }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
      },
      include: {
        inventory: {
          select: {
            id: true,
            quantity: true,
            minThreshold: true,
            maxThreshold: true,
            warehouseId: true,
            warehouse: { select: { id: true, name: true } },
          },
        },
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    })

    if (!filters?.lowStock && !filters?.criticalStock) return materials

    return materials.filter((m) => {
      const totalQty = m.inventory.reduce((sum, inv) => sum + Number(inv.quantity), 0)
      const minThreshold = Math.max(...m.inventory.map((inv) => Number(inv.minThreshold ?? 0)), 0)

      if (filters.criticalStock) return totalQty <= 0
      if (filters.lowStock) return totalQty > 0 && minThreshold > 0 && totalQty <= minThreshold
      return true
    })
  },

  async getCategories(companyId: string) {
    const rows = await db.material.findMany({
      where: { companyId, category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    })
    return rows.map((r) => r.category).filter(Boolean) as string[]
  },

  async getRecentStockMovements(companyId: string, limit: number = 10) {
    const rows = await db.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        sm.id,
        sm.project_id,
        sm.material_id,
        sm.user_id,
        sm.movement_type,
        sm.source_type,
        sm.source_warehouse_id,
        sm.destination_type,
        sm.destination_warehouse_id,
        sm.quantity,
        sm.description,
        sm.movement_date,
        m.name AS material_name,
        m.unit AS material_unit,
        p.name AS project_name,
        u.first_name AS user_first_name,
        u.last_name AS user_last_name,
        sw.name AS source_warehouse_name,
        dw.name AS destination_warehouse_name
      FROM stock_movements sm
      INNER JOIN materials m
        ON m.id = sm.material_id
      LEFT JOIN projects p
        ON p.id = sm.project_id
      LEFT JOIN users u
        ON u.id = sm.user_id
      LEFT JOIN warehouses sw
        ON sw.id = sm.source_warehouse_id
      LEFT JOIN warehouses dw
        ON dw.id = sm.destination_warehouse_id
      WHERE m.company_id = ${companyId}
      ORDER BY sm.movement_date DESC
      LIMIT ${limit}
    `

    return rows.map((row) => ({
      id: String(row.id),
      project_id: row.project_id ? String(row.project_id) : null,
      material_id: String(row.material_id),
      user_id: row.user_id ? String(row.user_id) : null,
      movement_type: String(row.movement_type),
      source_type: row.source_type ? String(row.source_type) : null,
      source_warehouse_id: row.source_warehouse_id ? String(row.source_warehouse_id) : null,
      destination_type: row.destination_type ? String(row.destination_type) : null,
      destination_warehouse_id: row.destination_warehouse_id ? String(row.destination_warehouse_id) : null,
      quantity: Number(row.quantity ?? 0),
      description: row.description ? String(row.description) : null,
      movement_date: row.movement_date,
      material: {
        id: String(row.material_id),
        name: String(row.material_name),
        unit: String(row.material_unit),
      },
      project: row.project_name
        ? {
            id: String(row.project_id),
            name: String(row.project_name),
          }
        : null,
      user:
        row.user_first_name || row.user_last_name
          ? {
              first_name: row.user_first_name ? String(row.user_first_name) : "",
              last_name: row.user_last_name ? String(row.user_last_name) : "",
            }
          : null,
      source_warehouse: row.source_warehouse_name
        ? {
            id: row.source_warehouse_id ? String(row.source_warehouse_id) : "",
            name: String(row.source_warehouse_name),
          }
        : null,
      destination_warehouse: row.destination_warehouse_name
        ? {
            id: row.destination_warehouse_id ? String(row.destination_warehouse_id) : "",
            name: String(row.destination_warehouse_name),
          }
        : null,
    }))
  },

  async getCriticalThresholds(companyId: string) {
    const rows = await db.inventory.findMany({
      where: { companyId, minThreshold: { gt: 0 } },
      include: {
        material: { select: { id: true, name: true, unit: true, category: true } },
        warehouse: { select: { id: true, name: true } },
      },
    })
    return rows
      .filter((r) => Number(r.quantity) <= Number(r.minThreshold))
      .sort((a, b) => Number(a.quantity) - Number(b.quantity))
  },

  async createStockMovement(movementData: Partial<StockMovement>) {
    if (!movementData.materialId) throw new Error("materialId is required")
    if (!movementData.movementType) throw new Error("movementType is required")
    if (movementData.quantity === undefined) throw new Error("quantity is required")

    return db.stockMovement.create({
      data: {
        materialId: movementData.materialId,
        movementType: movementData.movementType,
        quantity: movementData.quantity,
        projectId: movementData.projectId ?? null,
        userId: movementData.userId ?? null,
        description: movementData.notes ?? null,
        movementDate: movementData.movementDate ?? new Date(),
      },
    })
  },

  async updateMaterialStock(
    materialId: string,
    quantity: number,
    movementType: "in" | "out" | "adjustment",
  ) {
    const inventoryRow = await db.inventory.findFirst({ where: { materialId } })
    if (!inventoryRow) throw new Error(`No inventory record found for materialId: ${materialId}`)

    const current = Number(inventoryRow.quantity)
    let newQty: number

    if (movementType === "in") newQty = current + quantity
    else if (movementType === "out") newQty = current - quantity
    else newQty = quantity // adjustment = set directly

    if (newQty < 0) throw new Error("Stock cannot go below zero")

    return db.inventory.update({
      where: { id: inventoryRow.id },
      data: { quantity: newQty },
    })
  },

  async generateInventoryReport(companyId: string) {
    return db.inventory.findMany({
      where: { companyId },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitPrice: true,
            category: true,
            supplier: { select: { name: true } },
          },
        },
        warehouse: { select: { id: true, name: true, location: true } },
      },
      orderBy: [{ material: { category: "asc" } }, { material: { name: "asc" } }],
    })
  },

  async recordStockEntry(input: StockEntryInput) {
    const { companyId, materialId, warehouseId, quantity, notes, userId } = input

    if (quantity <= 0) throw new Error("Quantity must be greater than zero")

    return db.$transaction(async (tx) => {
      const [material, warehouse] = await Promise.all([
        tx.material.findFirst({
          where: { id: materialId, companyId },
          select: { id: true },
        }),
        tx.warehouse.findFirst({
          where: { id: warehouseId, companyId },
          select: { id: true },
        }),
      ])

      if (!material) throw new Error("Material not found")
      if (!warehouse) throw new Error("Warehouse not found")

      const inventoryRow = await tx.inventory.findFirst({
        where: { materialId, warehouseId, companyId },
        orderBy: { createdAt: "asc" },
      })

      if (inventoryRow) {
        await tx.inventory.update({
          where: { id: inventoryRow.id },
          data: { quantity: Number(inventoryRow.quantity) + quantity },
        })
      } else {
        await tx.inventory.create({
          data: {
            materialId,
            warehouseId,
            companyId,
            quantity,
            minThreshold: 0,
            maxThreshold: null,
          },
        })
      }

      return tx.stockMovement.create({
        data: {
          materialId,
          userId: userId ?? null,
          movementType: "in",
          sourceType: "supplier",
          destinationType: "warehouse",
          destinationWarehouseId: warehouseId,
          quantity,
          description: notes?.trim() || null,
          movementDate: new Date(),
        },
      })
    })
  },

  async transferStockBetweenWarehouses(input: StockTransferInput) {
    const { companyId, materialId, sourceWarehouseId, destinationWarehouseId, quantity, notes, userId } = input

    if (quantity <= 0) throw new Error("Quantity must be greater than zero")
    if (sourceWarehouseId === destinationWarehouseId) {
      throw new Error("Source and destination warehouses must be different")
    }

    return db.$transaction(async (tx) => {
      const [material, sourceWarehouse, destinationWarehouse] = await Promise.all([
        tx.material.findFirst({
          where: { id: materialId, companyId },
          select: { id: true },
        }),
        tx.warehouse.findFirst({
          where: { id: sourceWarehouseId, companyId },
          select: { id: true },
        }),
        tx.warehouse.findFirst({
          where: { id: destinationWarehouseId, companyId },
          select: { id: true },
        }),
      ])

      if (!material) throw new Error("Material not found")
      if (!sourceWarehouse || !destinationWarehouse) throw new Error("Warehouse not found")

      const sourceInventory = await tx.inventory.findFirst({
        where: { materialId, warehouseId: sourceWarehouseId, companyId },
        orderBy: { createdAt: "asc" },
      })

      const sourceQuantity = Number(sourceInventory?.quantity ?? 0)
      if (!sourceInventory || sourceQuantity < quantity) {
        throw new Error("Insufficient stock in source warehouse")
      }

      await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: sourceQuantity - quantity },
      })

      const destinationInventory = await tx.inventory.findFirst({
        where: { materialId, warehouseId: destinationWarehouseId, companyId },
        orderBy: { createdAt: "asc" },
      })

      if (destinationInventory) {
        await tx.inventory.update({
          where: { id: destinationInventory.id },
          data: { quantity: Number(destinationInventory.quantity) + quantity },
        })
      } else {
        await tx.inventory.create({
          data: {
            materialId,
            warehouseId: destinationWarehouseId,
            companyId,
            quantity,
            minThreshold: Number(sourceInventory.minThreshold ?? 0),
            maxThreshold: sourceInventory.maxThreshold != null ? Number(sourceInventory.maxThreshold) : null,
          },
        })
      }

      return tx.stockMovement.create({
        data: {
          materialId,
          userId: userId ?? null,
          movementType: "transfer",
          sourceType: "warehouse",
          sourceWarehouseId,
          destinationType: "warehouse",
          destinationWarehouseId,
          quantity,
          description: notes?.trim() || null,
          movementDate: new Date(),
        },
      })
    })
  },
}
