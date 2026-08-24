'use server'

import { db } from "@/lib/db"
import { checkAuth } from "@/lib/auth/auth-utils"
import { revalidatePath } from "next/cache"

export async function getInitialOrderData(companyId: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    // Fetch active suppliers
    const suppliers = await db.supplier.findMany({
      where: { 
        companyId,
        isActive: true
      },
      orderBy: { name: 'asc' }
    })

    // Fetch active projects
    const projects = await db.project.findMany({
      where: { 
        companyId,
        status: 'active'
      },
      orderBy: { name: 'asc' }
    })

    // Fetch all materials with inventory
    const materials = await db.material.findMany({
      where: { companyId },
      include: { inventory: true }
    })

    const normalizedMaterials = materials.map(normalizeMaterial)
    const normalizedProjects = projects.map(normalizeProject)

    return { 
      success: true, 
      data: {
        suppliers,
        projects: normalizedProjects,
        materials: normalizedMaterials
      }
    }
  } catch (error) {
    console.error("Error fetching initial order data:", error)
    return { success: false, error: "Failed to fetch data" }
  }
}

export async function getSupplierMaterials(supplierId: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const materials = await db.material.findMany({
      where: { supplierId },
      include: { inventory: true }
    })

    const normalizedMaterials = materials.map(normalizeMaterial)
    return { success: true, data: normalizedMaterials }
  } catch (error) {
    console.error("Error fetching supplier materials:", error)
    return { success: false, error: "Failed to fetch materials" }
  }
}

export async function createOrder(data: any) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const { items, ...orderData } = data

    // Create the purchase order
    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        ...orderData,
        companyId: user.companyId,
        createdById: user.id,
        updatedAt: new Date(),
        // Create items in the same transaction
        items: {
          create: items.map((item: any) => ({
            materialId: item.material_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
            notes: item.notes || null,
            updatedAt: new Date()
          }))
        }
      }
    })

    revalidatePath('/costs/orders')
    return { success: true, data: purchaseOrder }
  } catch (error: any) {
    console.error("Error creating order:", error)
    return { success: false, error: error.message || "Failed to create order" }
  }
}

function normalizeDecimal(value: any): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "object" && value !== null && typeof (value as any).toNumber === "function") {
    return (value as any).toNumber()
  }

  const num = Number(value)
  if (Number.isNaN(num)) return null
  return num
}

function normalizeOrderItem(item: any) {
  return {
    ...item,
    quantity: normalizeDecimal(item.quantity) ?? 0,
    unitPrice: normalizeDecimal(item.unitPrice) ?? 0,
    totalPrice: normalizeDecimal(item.totalPrice) ?? 0,
    material: item.material
      ? {
          ...item.material,
          unitPrice: normalizeDecimal(item.material.unitPrice) ?? 0,
          unitOfMeasure: item.material.unitOfMeasure ?? item.material.unit ?? "",
        }
      : null,
  }
}

function normalizeMaterial(material: any) {
  if (!material) return material

  const totalStock = Array.isArray(material.inventory)
    ? material.inventory.reduce((sum: number, inv: any) => sum + (normalizeDecimal(inv.quantity) ?? 0), 0)
    : null

  const firstInv = Array.isArray(material.inventory) ? material.inventory[0] : null

  return {
    ...material,
    unitPrice: normalizeDecimal(material.unitPrice) ?? 0,
    current_stock: totalStock,
    min_stock_level: firstInv ? normalizeDecimal(firstInv.minThreshold) : null,
    max_stock_level: firstInv ? normalizeDecimal(firstInv.maxThreshold) : null,
  }
}

function normalizeProject(project: any) {
  if (!project) return project

  return {
    ...project,
    totalBudget: normalizeDecimal(project.totalBudget),
    currentCost: normalizeDecimal(project.currentCost),
  }
}

function normalizeOrder(order: any) {
  if (!order) return order

  return {
    ...order,
    totalAmount: normalizeDecimal(order.totalAmount),
    items: Array.isArray(order.items) ? order.items.map(normalizeOrderItem) : [],
    supplier: order.supplier ? { ...order.supplier } : null,
    createdBy: order.createdBy ? { ...order.createdBy } : null,
    project: order.project ? { ...order.project } : null,
  }
}

export async function getOrderById(id: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const order = await db.purchaseOrder.findUnique({
      where: { 
        id,
        companyId: user.companyId
      },
      include: {
        supplier: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: {
          include: {
            material: true
          }
        }
      }
    })

    if (!order) return { success: false, error: "Order not found" }

    const normalizedOrder = normalizeOrder(order)
    return { success: true, data: normalizedOrder }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: "Failed to fetch order" }
  }
}

export async function getOrders(companyId: string, options?: { search?: string; status?: string }) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const where: any = { companyId: user.companyId }

    if (options?.status) {
      where.status = options.status
    }

    if (options?.search) {
      where.supplier = {
        name: { contains: options.search }
      }
    }

    const orders = await db.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const normalizedOrders = orders.map(normalizeOrder)
    return { success: true, data: normalizedOrders }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { success: false, error: "Failed to fetch orders" }
  }
}

export async function updateOrder(id: string, data: { status?: string; expectedDelivery?: string | Date | null; orderDate?: string | Date | null; notes?: string | null }) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const updateData: any = {}
    if (data.status !== undefined) updateData.status = data.status
    if (data.expectedDelivery !== undefined) updateData.expectedDelivery = data.expectedDelivery ? new Date(data.expectedDelivery) : null
    if (data.orderDate !== undefined) updateData.orderDate = data.orderDate ? new Date(data.orderDate) : null
    if (data.notes !== undefined) updateData.notes = data.notes

    const updated = await db.purchaseOrder.update({
      where: { id, companyId: user.companyId },
      data: updateData
    })

    revalidatePath('/costs/orders')
    revalidatePath(`/costs/orders/${id}`)

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Failed to update order" }
  }
}

export async function updateOrderFull(
  id: string,
  data: {
    status?: string
    orderDate?: string | Date | null
    expectedDelivery?: string | Date | null
    notes?: string | null
    totalAmount?: number
    items?: Array<{
      id?: string
      material_id: string
      quantity: number
      unit_price: number
      total_price: number
      notes?: string | null
    }>
  }
) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const updateData: any = { updatedAt: new Date() }
    if (data.status !== undefined) updateData.status = data.status
    if (data.orderDate !== undefined) updateData.orderDate = data.orderDate ? new Date(data.orderDate) : null
    if (data.expectedDelivery !== undefined) updateData.expectedDelivery = data.expectedDelivery ? new Date(data.expectedDelivery) : null
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount

    // Update order fields
    await db.purchaseOrder.update({
      where: { id, companyId: user.companyId },
      data: updateData
    })

    // Replace items if provided
    if (data.items) {
      // Delete all existing items
      await db.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id }
      })

      // Re-create with updated data
      await db.purchaseOrderItem.createMany({
        data: data.items.map(item => ({
          purchaseOrderId: id,
          materialId: item.material_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          notes: item.notes || null,
          updatedAt: new Date()
        }))
      })
    }

    revalidatePath('/costs/orders')
    revalidatePath(`/costs/orders/${id}`)
    revalidatePath(`/costs/orders/${id}/print`)

    return { success: true }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Failed to update order" }
  }
}

export async function deleteOrderItem(itemId: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    // Verify the item belongs to this company's order
    const item = await db.purchaseOrderItem.findFirst({
      where: {
        id: itemId,
        purchaseOrder: { companyId: user.companyId }
      }
    })
    if (!item) throw new Error("Item not found")

    await db.purchaseOrderItem.delete({ where: { id: itemId } })

    revalidatePath('/costs/orders')
    return { success: true }
  } catch (error) {
    console.error("Error deleting order item:", error)
    return { success: false, error: "Failed to delete order item" }
  }
}

export async function deleteOrder(id: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const order = await db.purchaseOrder.findFirst({
      where: { id, companyId: user.companyId },
      select: { id: true },
    })
    if (!order) throw new Error("Order not found")

    await db.$transaction([
      db.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } }),
      db.purchaseOrder.delete({ where: { id } }),
    ])

    revalidatePath('/costs/orders')
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    return { success: false, error: "Failed to delete order" }
  }
}
