import { NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/auth-utils"
import { db } from "@/lib/db"
import { inventoryService } from "@/lib/services/inventoryService"

// ============================================================
// HELPERS
// ============================================================

function jsonError(
  error: string,
  status: number
) {
  return NextResponse.json(
    { error },
    { status }
  )
}

function isValidPositiveQuantity(
  quantity: number
) {
  return (
    Number.isFinite(quantity) &&
    quantity > 0
  )
}

function isValidNonNegativeQuantity(
  quantity: number
) {
  return (
    Number.isFinite(quantity) &&
    quantity >= 0
  )
}

// ============================================================
// PATCH
// ============================================================
//
// Direct inventory adjustment.
//
// This endpoint is intentionally kept as an explicit
// "set quantity" operation.
//
// IMPORTANT:
// It is NOT used for normal stock entry / transfer.
// Those operations go through POST and inventoryService.
//
// ============================================================

export async function PATCH(
  req: Request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user = await checkAuth()

    if (!user) {
      return jsonError(
        "Unauthorized",
        401
      )
    }

    // ========================================================
    // BODY
    // ========================================================

    let body: any

    try {
      body = await req.json()
    } catch {
      return jsonError(
        "Invalid JSON body",
        400
      )
    }

    const materialId =
      typeof body?.material_id ===
      "string"
        ? body.material_id.trim()
        : ""

    const warehouseId =
      typeof body?.warehouse_id ===
      "string"
        ? body.warehouse_id.trim()
        : ""

    const quantity =
      Number(body?.quantity)

    // ========================================================
    // VALIDATION
    // ========================================================

    if (
      !materialId ||
      !warehouseId ||
      !isValidNonNegativeQuantity(
        quantity
      )
    ) {
      return jsonError(
        "Material, warehouse and a non-negative quantity are required",
        400
      )
    }

    // ========================================================
    // VERIFY MATERIAL + WAREHOUSE
    // ========================================================

    const [
      material,
      warehouse,
    ] = await Promise.all([
      db.material.findFirst({
        where: {
          id: materialId,
          companyId:
            user.companyId,
        },

        select: {
          id: true,
        },
      }),

      db.warehouse.findFirst({
        where: {
          id: warehouseId,
          companyId:
            user.companyId,
        },

        select: {
          id: true,
        },
      }),
    ])

    if (!material) {
      return jsonError(
        "Material not found",
        404
      )
    }

    if (!warehouse) {
      return jsonError(
        "Warehouse not found",
        404
      )
    }

    // ========================================================
    // TRANSACTION
    // ========================================================
    //
    // We use a transaction so the inventory update is atomic.
    //
    // ========================================================

    const result =
      await db.$transaction(
        async (tx) => {
          const inventoryRow =
            await tx.inventory.findFirst({
              where: {
                materialId,
                warehouseId,
                companyId:
                  user.companyId,
              },

              orderBy: {
                createdAt: "asc",
              },
            })

          // ==================================================
          // UPDATE EXISTING ROW
          // ==================================================

          if (inventoryRow) {
            const updated =
              await tx.inventory.update({
                where: {
                  id: inventoryRow.id,
                },

                data: {
                  quantity,
                  updatedAt:
                    new Date(),
                },
              })

            return {
              created: false,
              quantity:
                Number(
                  updated.quantity
                ),
            }
          }

          // ==================================================
          // CREATE INVENTORY ROW
          // ==================================================

          const created =
            await tx.inventory.create({
              data: {
                materialId,
                warehouseId,
                companyId:
                  user.companyId,

                quantity,

                minThreshold: 0,

                maxThreshold:
                  null,

                updatedAt:
                  new Date(),
              },
            })

          return {
            created: true,
            quantity:
              Number(
                created.quantity
              ),
          }
        }
      )

    return NextResponse.json({
      success: true,
      quantity:
        result.quantity,
      created:
        result.created,
    })
  } catch (error) {
    console.error(
      "Error setting inventory:",
      error
    )

    return jsonError(
      "Internal server error",
      500
    )
  }
}

// ============================================================
// POST
// ============================================================
//
// Supported operations:
//
// 1. entry
//    Supplier -> Warehouse
//
// 2. transfer
//    Warehouse -> Warehouse
//
// Both operations MUST go through inventoryService.
// ============================================================

export async function POST(
  req: Request
) {
  try {
    // ========================================================
    // AUTH
    // ========================================================

    const user = await checkAuth()

    if (!user) {
      return jsonError(
        "Unauthorized",
        401
      )
    }

    // ========================================================
    // BODY
    // ========================================================

    let body: any

    try {
      body = await req.json()
    } catch {
      return jsonError(
        "Invalid JSON body",
        400
      )
    }

    const operation =
      typeof body?.operation ===
      "string"
        ? body.operation.trim()
        : "entry"

    const materialId =
      typeof body?.material_id ===
      "string"
        ? body.material_id.trim()
        : ""

    const quantity =
      Number(body?.quantity)

    const notes =
      typeof body?.notes ===
      "string"
        ? body.notes.trim()
        : ""

    // ========================================================
    // GENERAL VALIDATION
    // ========================================================

    if (!materialId) {
      return jsonError(
        "Material is required",
        400
      )
    }

    if (
      !isValidPositiveQuantity(
        quantity
      )
    ) {
      return jsonError(
        "Quantity must be greater than zero",
        400
      )
    }

    // ========================================================
    // STOCK ENTRY
    // ========================================================

    if (operation === "entry") {
      const warehouseId =
        typeof body?.warehouse_id ===
        "string"
          ? body.warehouse_id.trim()
          : ""

      if (!warehouseId) {
        return jsonError(
          "Destination warehouse is required",
          400
        )
      }

      const movement =
        await inventoryService.recordStockEntry(
          {
            companyId:
              user.companyId,

            userId:
              user.id,

            materialId,

            warehouseId,

            quantity,

            notes,
          }
        )

      return NextResponse.json(
        {
          success: true,

          message:
            "Stock entry recorded",

          id: movement.id,
        },
        {
          status: 201,
        }
      )
    }

    // ========================================================
    // STOCK TRANSFER
    // ========================================================

    if (
      operation === "transfer"
    ) {
      const sourceWarehouseId =
        typeof body?.source_warehouse_id ===
        "string"
          ? body.source_warehouse_id.trim()
          : ""

      const destinationWarehouseId =
        typeof body?.destination_warehouse_id ===
        "string"
          ? body.destination_warehouse_id.trim()
          : ""

      if (!sourceWarehouseId) {
        return jsonError(
          "Source warehouse is required",
          400
        )
      }

      if (!destinationWarehouseId) {
        return jsonError(
          "Destination warehouse is required",
          400
        )
      }

      if (
        sourceWarehouseId ===
        destinationWarehouseId
      ) {
        return jsonError(
          "Source and destination warehouses must be different",
          400
        )
      }

      const movement =
        await inventoryService.transferStockBetweenWarehouses(
          {
            companyId:
              user.companyId,

            userId:
              user.id,

            materialId,

            sourceWarehouseId,

            destinationWarehouseId,

            quantity,

            notes,
          }
        )

      return NextResponse.json(
        {
          success: true,

          message:
            "Stock transfer recorded",

          id: movement.id,
        },
        {
          status: 201,
        }
      )
    }

    // ========================================================
    // UNKNOWN OPERATION
    // ========================================================

    return jsonError(
      "Unsupported inventory operation",
      400
    )
  } catch (error) {
    console.error(
      "Error updating inventory:",
      error
    )

    // ========================================================
    // KNOWN BUSINESS ERRORS
    // ========================================================

    if (error instanceof Error) {
      const statusByMessage =
        new Map<string, number>([
          [
            "Material not found",
            404,
          ],

          [
            "Warehouse not found",
            404,
          ],

          [
            "Insufficient stock in source warehouse",
            400,
          ],

          [
            "Source and destination warehouses must be different",
            400,
          ],

          [
            "Quantity must be greater than zero",
            400,
          ],

          [
            "Stock cannot go below zero",
            400,
          ],

          [
            "Material, warehouse and a non-negative quantity are required",
            400,
          ],
        ])

      const status =
        statusByMessage.get(
          error.message
        )

      if (status) {
        return jsonError(
          error.message,
          status
        )
      }
    }

    // ========================================================
    // UNKNOWN ERROR
    // ========================================================

    return jsonError(
      "Internal server error",
      500
    )
  }
}