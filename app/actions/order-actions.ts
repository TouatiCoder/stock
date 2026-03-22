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

    // Fetch all materials
    const materials = await db.material.findMany({
      where: { companyId }
    })

    return { 
      success: true, 
      data: {
        suppliers,
        projects,
        materials
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
      where: { supplierId }
    })

    return { success: true, data: materials }
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

    return { success: true, data: order }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: "Failed to fetch order" }
  }
}

export async function deleteOrder(id: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    await db.purchaseOrder.delete({
      where: { 
        id,
        companyId: user.companyId
      }
    })

    revalidatePath('/costs/orders')
    return { success: true }
  } catch (error) {
    console.error("Error deleting order:", error)
    return { success: false, error: "Failed to delete order" }
  }
}
