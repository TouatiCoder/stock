import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"

// ============================================================
// TYPES
// ============================================================

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
  movementType:
    | "in"
    | "out"
    | "transfer"
    | "return"
    | "adjustment"
    | "consumption"
  materialId: string
  quantity: number
  unitPrice?: number
  totalValue?: number
  sourceType?:
    | "supplier"
    | "warehouse"
    | "project"
    | "adjustment"
  sourceId?: string
  destinationType?:
    | "warehouse"
    | "project"
    | "supplier"
    | "scrap"
  destinationId?: string
  projectId?: string
  userId: string
  notes?: string
  movementDate: Date
  createdAt: Date
}

// ============================================================
// HELPERS
// ============================================================

function validatePositiveQuantity(quantity: number) {
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero"
    )
  }
}

function validateNonNegativeQuantity(quantity: number) {
  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity < 0
  ) {
    throw new Error(
      "Quantity must be a non-negative number"
    )
  }
}

function toDecimal(value: number) {
  return new Prisma.Decimal(
    String(value)
  )
}

function toNumber(value: unknown) {
  const result = Number(value)

  return Number.isFinite(result)
    ? result
    : 0
}

// ============================================================
// INVENTORY SERVICE
// ============================================================

export const inventoryService = {
  // ==========================================================
  // INVENTORY STATS
  // ==========================================================

  async getInventoryStats(
    companyId: string
  ): Promise<InventoryStats> {
    const materialIds = await db.material
      .findMany({
        where: {
          companyId,
        },
        select: {
          id: true,
        },
      })
      .then((rows) =>
        rows.map((row) => row.id)
      )

    const [
      inventoryRows,
      recentMovements,
    ] = await Promise.all([
      db.inventory.findMany({
        where: {
          companyId,
        },
        include: {
          material: {
            select: {
              unitPrice: true,
              category: true,
            },
          },
        },
      }),

      materialIds.length > 0
        ? db.stockMovement.count({
            where: {
              materialId: {
                in: materialIds,
              },
              movementDate: {
                gte: new Date(
                  Date.now() -
                    30 *
                      24 *
                      60 *
                      60 *
                      1000
                ),
              },
            },
          })
        : Promise.resolve(0),
    ])

    let totalValue = 0
    let lowStockCount = 0
    let criticalStockCount = 0

    const categories =
      new Set<string>()

    for (const row of inventoryRows) {
      const quantity = toNumber(
        row.quantity
      )

      const unitPrice = toNumber(
        row.material.unitPrice
      )

      const minThreshold = toNumber(
        row.minThreshold
      )

      totalValue +=
        quantity * unitPrice

      /*
       * Stock status:
       *
       * quantity <= 0
       *     => critical / out of stock
       *
       * quantity > 0 && quantity <= minimum
       *     => low stock
       */
      if (quantity <= 0) {
        criticalStockCount += 1
      } else if (
        minThreshold > 0 &&
        quantity <= minThreshold
      ) {
        lowStockCount += 1
      }

      if (row.material.category) {
        categories.add(
          row.material.category
        )
      }
    }

    return {
      totalMaterials:
        inventoryRows.length,

      totalValue,

      lowStockCount,

      criticalStockCount,

      outOfStockCount:
        criticalStockCount,

      recentMovements,

      categoriesCount:
        categories.size,
    }
  },

  // ==========================================================
  // GET ALL MATERIALS
  // ==========================================================

  async getAllMaterials(
    companyId: string,
    filters?: {
      search?: string
      category?: string
      supplierId?: string
      lowStock?: boolean
      criticalStock?: boolean
    }
  ) {
    const materials =
      await db.material.findMany({
        where: {
          companyId,

          ...(filters?.search && {
            OR: [
              {
                name: {
                  contains:
                    filters.search,
                },
              },
              {
                description: {
                  contains:
                    filters.search,
                },
              },
              {
                category: {
                  contains:
                    filters.search,
                },
              },
              {
                supplier: {
                  is: {
                    name: {
                      contains:
                        filters.search,
                    },
                  },
                },
              },
            ],
          }),

          ...(filters?.category && {
            category: filters.category,
          }),

          ...(filters?.supplierId && {
            supplierId:
              filters.supplierId,
          }),
        },

        include: {
          inventory: {
            select: {
              id: true,
              quantity: true,
              minThreshold: true,
              maxThreshold: true,
              warehouseId: true,

              warehouse: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      })

    /*
     * No stock filter:
     * return directly.
     */
    if (
      !filters?.lowStock &&
      !filters?.criticalStock
    ) {
      return materials
    }

    /*
     * Stock filters.
     *
     * We calculate the total quantity
     * across all warehouses.
     */
    return materials.filter(
      (material) => {
        const totalQuantity =
          material.inventory.reduce(
            (sum, inventory) =>
              sum +
              toNumber(
                inventory.quantity
              ),
            0
          )

        const thresholds =
          material.inventory.map(
            (inventory) =>
              toNumber(
                inventory.minThreshold
              )
          )

        const minThreshold =
          thresholds.length > 0
            ? Math.max(
                ...thresholds,
                0
              )
            : 0

        if (
          filters.criticalStock
        ) {
          return totalQuantity <= 0
        }

        if (filters.lowStock) {
          return (
            totalQuantity > 0 &&
            minThreshold > 0 &&
            totalQuantity <=
              minThreshold
          )
        }

        return true
      }
    )
  },

  // ==========================================================
  // CATEGORIES
  // ==========================================================

  async getCategories(
    companyId: string
  ) {
    const rows =
      await db.material.findMany({
        where: {
          companyId,
          category: {
            not: null,
          },
        },

        select: {
          category: true,
        },

        distinct: ["category"],

        orderBy: {
          category: "asc",
        },
      })

    return rows
      .map((row) => row.category)
      .filter(Boolean) as string[]
  },

  // ==========================================================
  // RECENT STOCK MOVEMENTS
  // ==========================================================

  async getRecentStockMovements(
    companyId: string,
    limit: number = 10
  ) {
    const safeLimit =
      Number.isFinite(limit) &&
      limit > 0
        ? Math.floor(limit)
        : 10

    let rows: Array<Record<string, unknown>>;
    try {
      rows = await db.$queryRaw<Array<Record<string, unknown>>>`
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
          ON sw.id =
            sm.source_warehouse_id

        LEFT JOIN warehouses dw
          ON dw.id =
            sm.destination_warehouse_id

        WHERE m.company_id = ${companyId}

        ORDER BY
          sm.movement_date DESC

        LIMIT ${safeLimit}
      `
      ;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const missingTransferColumn = /Unknown column.*(?:source_type|source_warehouse_id|destination_type|destination_warehouse_id)/i.test(message);
      if (!missingTransferColumn) throw error;

      // Older production databases may not yet have the optional transfer columns.
      // Keep the movement history usable and return null for transfer-only metadata.
      rows = await db.$queryRaw<Array<Record<string, unknown>>>`
        SELECT
          sm.id,
          sm.project_id,
          sm.material_id,
          sm.user_id,
          sm.movement_type,
          NULL AS source_type,
          NULL AS source_warehouse_id,
          NULL AS destination_type,
          NULL AS destination_warehouse_id,
          sm.quantity,
          sm.description,
          sm.movement_date,
          m.name AS material_name,
          m.unit AS material_unit,
          p.name AS project_name,
          u.first_name AS user_first_name,
          u.last_name AS user_last_name,
          NULL AS source_warehouse_name,
          NULL AS destination_warehouse_name
        FROM stock_movements sm
        INNER JOIN materials m ON m.id = sm.material_id
        LEFT JOIN projects p ON p.id = sm.project_id
        LEFT JOIN users u ON u.id = sm.user_id
        WHERE m.company_id = ${companyId}
        ORDER BY sm.movement_date DESC
        LIMIT ${safeLimit}
      `;
    }

    return rows.map((row) => ({
      id: String(row.id),

      project_id:
        row.project_id
          ? String(row.project_id)
          : null,

      material_id:
        String(row.material_id),

      user_id:
        row.user_id
          ? String(row.user_id)
          : null,

      movement_type:
        String(
          row.movement_type
        ),

      source_type:
        row.source_type
          ? String(row.source_type)
          : null,

      source_warehouse_id:
        row.source_warehouse_id
          ? String(
              row.source_warehouse_id
            )
          : null,

      destination_type:
        row.destination_type
          ? String(
              row.destination_type
            )
          : null,

      destination_warehouse_id:
        row.destination_warehouse_id
          ? String(
              row.destination_warehouse_id
            )
          : null,

      quantity: toNumber(
        row.quantity
      ),

      description:
        row.description
          ? String(
              row.description
            )
          : null,

      movement_date:
        row.movement_date,

      material: {
        id: String(
          row.material_id
        ),

        name: String(
          row.material_name
        ),

        unit: String(
          row.material_unit
        ),
      },

      project:
        row.project_name
          ? {
              id: String(
                row.project_id
              ),

              name: String(
                row.project_name
              ),
            }
          : null,

      user:
        row.user_first_name ||
        row.user_last_name
          ? {
              first_name:
                row.user_first_name
                  ? String(
                      row.user_first_name
                    )
                  : "",

              last_name:
                row.user_last_name
                  ? String(
                      row.user_last_name
                    )
                  : "",
            }
          : null,

      source_warehouse:
        row.source_warehouse_name
          ? {
              id:
                row.source_warehouse_id
                  ? String(
                      row.source_warehouse_id
                    )
                  : "",

              name: String(
                row.source_warehouse_name
              ),
            }
          : null,

      destination_warehouse:
        row.destination_warehouse_name
          ? {
              id:
                row.destination_warehouse_id
                  ? String(
                      row.destination_warehouse_id
                    )
                  : "",

              name: String(
                row.destination_warehouse_name
              ),
            }
          : null,
    }))
  },

  // ==========================================================
  // CRITICAL THRESHOLDS
  // ==========================================================

  async getCriticalThresholds(
    companyId: string
  ) {
    const rows =
      await db.inventory.findMany({
        where: {
          companyId,

          minThreshold: {
            gt: 0,
          },
        },

        include: {
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              category: true,
            },
          },

          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

    return rows
      .filter(
        (row) =>
          toNumber(row.quantity) <=
          toNumber(row.minThreshold)
      )
      .sort(
        (a, b) =>
          toNumber(a.quantity) -
          toNumber(b.quantity)
      )
  },

  // ==========================================================
  // CREATE STOCK MOVEMENT
  // ==========================================================

  async createStockMovement(
    movementData: Partial<StockMovement>
  ) {
    if (!movementData.materialId) {
      throw new Error(
        "materialId is required"
      )
    }

    if (!movementData.movementType) {
      throw new Error(
        "movementType is required"
      )
    }

    if (
      movementData.quantity ===
      undefined
    ) {
      throw new Error(
        "quantity is required"
      )
    }

    if (
      !Number.isFinite(
        Number(movementData.quantity)
      ) ||
      Number(movementData.quantity) <= 0
    ) {
      throw new Error(
        "Quantity must be greater than zero"
      )
    }

    return db.stockMovement.create({
      data: {
        materialId:
          movementData.materialId,

        movementType:
          movementData.movementType,

        quantity:
          movementData.quantity,

        projectId:
          movementData.projectId ??
          null,

        userId:
          movementData.userId ??
          null,

        description:
          movementData.notes ??
          null,

        movementDate:
          movementData.movementDate ??
          new Date(),
      },
    })
  },

  // ==========================================================
  // UPDATE MATERIAL STOCK
  // ==========================================================
  //
  // IMPORTANT:
  // This method works on the material's inventory record.
  //
  // If the same material exists in several warehouses,
  // warehouseId MUST be provided by the caller in order
  // to know which stock should be changed.
  //
  // The public signature is kept compatible with the
  // existing code, so the current behavior is preserved.
  // ==========================================================

  async updateMaterialStock(
    materialId: string,
    quantity: number,
    movementType:
      | "in"
      | "out"
      | "adjustment"
  ) {
    validateNonNegativeQuantity(
      quantity
    )

    if (!materialId) {
      throw new Error(
        "materialId is required"
      )
    }

    /*
     * For "in" and "out", zero is not
     * a useful movement.
     */
    if (
      (movementType === "in" ||
        movementType === "out") &&
      quantity <= 0
    ) {
      throw new Error(
        "Quantity must be greater than zero"
      )
    }

    const inventoryRow =
      await db.inventory.findFirst({
        where: {
          materialId,
        },

        orderBy: {
          createdAt: "asc",
        },
      })

    if (!inventoryRow) {
      throw new Error(
        `No inventory record found for materialId: ${materialId}`
      )
    }

    const current =
      toNumber(
        inventoryRow.quantity
      )

    let newQuantity: number

    if (movementType === "in") {
      newQuantity =
        current + quantity
    } else if (
      movementType === "out"
    ) {
      newQuantity =
        current - quantity
    } else {
      /*
       * adjustment means SET,
       * not add/subtract.
       */
      newQuantity = quantity
    }

    if (newQuantity < 0) {
      throw new Error(
        "Stock cannot go below zero"
      )
    }

    return db.inventory.update({
      where: {
        id: inventoryRow.id,
      },

      data: {
        quantity:
          toDecimal(newQuantity),

        updatedAt:
          new Date(),
      },
    })
  },

  // ==========================================================
  // GENERATE INVENTORY REPORT
  // ==========================================================

  async generateInventoryReport(
    companyId: string
  ) {
    return db.inventory.findMany({
      where: {
        companyId,
      },

      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            unitPrice: true,
            category: true,

            supplier: {
              select: {
                name: true,
              },
            },
          },
        },

        warehouse: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },

      orderBy: [
        {
          material: {
            category: "asc",
          },
        },
        {
          material: {
            name: "asc",
          },
        },
      ],
    })
  },

  // ==========================================================
  // RECORD STOCK ENTRY
  // ==========================================================

  async recordStockEntry(
    input: StockEntryInput
  ) {
    const {
      companyId,
      materialId,
      warehouseId,
      quantity,
      notes,
      userId,
    } = input

    validatePositiveQuantity(
      quantity
    )

    if (!companyId) {
      throw new Error(
        "companyId is required"
      )
    }

    if (!materialId) {
      throw new Error(
        "materialId is required"
      )
    }

    if (!warehouseId) {
      throw new Error(
        "warehouseId is required"
      )
    }

    return db.$transaction(
      async (tx) => {
        // ======================================================
        // VALIDATE MATERIAL + WAREHOUSE
        // ======================================================

        const [
          material,
          warehouse,
        ] = await Promise.all([
          tx.material.findFirst({
            where: {
              id: materialId,
              companyId,
            },

            select: {
              id: true,
            },
          }),

          tx.warehouse.findFirst({
            where: {
              id: warehouseId,
              companyId,
            },

            select: {
              id: true,
            },
          }),
        ])

        if (!material) {
          throw new Error(
            "Material not found"
          )
        }

        if (!warehouse) {
          throw new Error(
            "Warehouse not found"
          )
        }

        // ======================================================
        // FIND INVENTORY ROW
        // ======================================================

        const inventoryRow =
          await tx.inventory.findFirst({
            where: {
              materialId,
              warehouseId,
              companyId,
            },

            orderBy: {
              createdAt: "asc",
            },
          })

        // ======================================================
        // UPDATE EXISTING STOCK
        // ======================================================

        if (inventoryRow) {
          const currentQuantity =
            toNumber(
              inventoryRow.quantity
            )

          const newQuantity =
            currentQuantity +
            quantity

          await tx.inventory.update({
            where: {
              id: inventoryRow.id,
            },

            data: {
              quantity:
                toDecimal(
                  newQuantity
                ),

              updatedAt:
                new Date(),
            },
          })
        }

        // ======================================================
        // CREATE STOCK ROW
        // ======================================================

        else {
          await tx.inventory.create({
            data: {
              materialId,

              warehouseId,

              companyId,

              quantity:
                toDecimal(quantity),

              minThreshold:
                toDecimal(0),

              maxThreshold: null,

              updatedAt:
                new Date(),
            },
          })
        }

        // ======================================================
        // CREATE MOVEMENT
        // ======================================================

        // Use an explicit insert for the legacy stock-movement table.
        // Prisma's generated INSERT/RETURNING can reference optional transfer
        // columns that may not exist yet in older production databases.
        const movementId = crypto.randomUUID()
        const movementDate = new Date()
        const description = notes?.trim() || null

        await tx.$executeRaw`
          INSERT INTO stock_movements
            (id, material_id, user_id, movement_type, quantity, description, movement_date)
          VALUES
            (${movementId}, ${materialId}, ${userId ?? null}, 'in', ${toDecimal(quantity)}, ${description}, ${movementDate})
        `

        return {
          id: movementId,
          materialId,
          userId: userId ?? null,
          movementType: "in",
          quantity: toDecimal(quantity),
          description,
          movementDate,
        }
      }
    )
  },

  // ==========================================================
  // TRANSFER STOCK BETWEEN WAREHOUSES
  // ==========================================================

  async transferStockBetweenWarehouses(
    input: StockTransferInput
  ) {
    const {
      companyId,
      materialId,
      sourceWarehouseId,
      destinationWarehouseId,
      quantity,
      notes,
      userId,
    } = input

    validatePositiveQuantity(
      quantity
    )

    if (!companyId) {
      throw new Error(
        "companyId is required"
      )
    }

    if (!materialId) {
      throw new Error(
        "materialId is required"
      )
    }

    if (!sourceWarehouseId) {
      throw new Error(
        "Source warehouse is required"
      )
    }

    if (!destinationWarehouseId) {
      throw new Error(
        "Destination warehouse is required"
      )
    }

    if (
      sourceWarehouseId ===
      destinationWarehouseId
    ) {
      throw new Error(
        "Source and destination warehouses must be different"
      )
    }

    return db.$transaction(
      async (tx) => {
        // ======================================================
        // VALIDATE MATERIAL + BOTH WAREHOUSES
        // ======================================================

        const [
          material,
          sourceWarehouse,
          destinationWarehouse,
        ] = await Promise.all([
          tx.material.findFirst({
            where: {
              id: materialId,
              companyId,
            },

            select: {
              id: true,
            },
          }),

          tx.warehouse.findFirst({
            where: {
              id: sourceWarehouseId,
              companyId,
            },

            select: {
              id: true,
            },
          }),

          tx.warehouse.findFirst({
            where: {
              id: destinationWarehouseId,
              companyId,
            },

            select: {
              id: true,
            },
          }),
        ])

        if (!material) {
          throw new Error(
            "Material not found"
          )
        }

        if (
          !sourceWarehouse ||
          !destinationWarehouse
        ) {
          throw new Error(
            "Warehouse not found"
          )
        }

        // ======================================================
        // SOURCE INVENTORY
        // ======================================================

        const sourceInventory =
          await tx.inventory.findFirst({
            where: {
              materialId,
              warehouseId:
                sourceWarehouseId,
              companyId,
            },

            orderBy: {
              createdAt: "asc",
            },
          })

        const sourceQuantity =
          toNumber(
            sourceInventory?.quantity
          )

        if (
          !sourceInventory ||
          sourceQuantity <
            quantity
        ) {
          throw new Error(
            "Insufficient stock in source warehouse"
          )
        }

        // ======================================================
        // DESTINATION INVENTORY
        // ======================================================

        const destinationInventory =
          await tx.inventory.findFirst({
            where: {
              materialId,
              warehouseId:
                destinationWarehouseId,
              companyId,
            },

            orderBy: {
              createdAt: "asc",
            },
          })

        // ======================================================
        // UPDATE SOURCE
        // ======================================================

        const newSourceQuantity =
          sourceQuantity -
          quantity

        if (
          newSourceQuantity < 0
        ) {
          throw new Error(
            "Stock cannot go below zero"
          )
        }

        await tx.inventory.update({
          where: {
            id: sourceInventory.id,
          },

          data: {
            quantity:
              toDecimal(
                newSourceQuantity
              ),

            updatedAt:
              new Date(),
          },
        })

        // ======================================================
        // UPDATE DESTINATION
        // ======================================================

        if (destinationInventory) {
          const destinationQuantity =
            toNumber(
              destinationInventory.quantity
            )

          const newDestinationQuantity =
            destinationQuantity +
            quantity

          await tx.inventory.update({
            where: {
              id: destinationInventory.id,
            },

            data: {
              quantity:
                toDecimal(
                  newDestinationQuantity
                ),

              updatedAt:
                new Date(),
            },
          })
        }

        // ======================================================
        // CREATE DESTINATION ROW
        // ======================================================

        else {
          await tx.inventory.create({
            data: {
              materialId,

              warehouseId:
                destinationWarehouseId,

              companyId,

              quantity:
                toDecimal(quantity),

              /*
               * Keep the same threshold configuration
               * when creating the destination stock row.
               */
              minThreshold:
                toDecimal(
                  toNumber(
                    sourceInventory.minThreshold
                  )
                ),

              maxThreshold:
                sourceInventory.maxThreshold !=
                null
                  ? toDecimal(
                      toNumber(
                        sourceInventory.maxThreshold
                      )
                    )
                  : null,

              updatedAt:
                new Date(),
            },
          })
        }

        // ======================================================
        // CREATE TRANSFER MOVEMENT
        // ======================================================

        return tx.stockMovement.create({
          data: {
            materialId,

            userId:
              userId ?? null,

            movementType:
              "transfer",

            sourceType:
              "warehouse",

            sourceWarehouseId,

            destinationType:
              "warehouse",

            destinationWarehouseId,

            quantity:
              toDecimal(quantity),

            description:
              notes?.trim() ||
              null,

            movementDate:
              new Date(),
          },
        })
      }
    )
  },
}