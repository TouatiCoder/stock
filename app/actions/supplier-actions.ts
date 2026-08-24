'use server'

import { db } from "@/lib/db"
import { checkAuth } from "@/lib/auth/auth-utils"
import { revalidatePath } from "next/cache"

export async function getSuppliers(companyId: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const suppliers = await db.supplier.findMany({
      where: { companyId },
      orderBy: {
        name: 'asc'
      }
    })

    return { success: true, data: suppliers }
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return { success: false, error: "Failed to fetch suppliers" }
  }
}

export async function getSupplierStats(companyId: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const suppliers = await db.supplier.findMany({
      where: { companyId }
    })

    // Calculate stats
    const total = suppliers.length
    const active = suppliers.filter(s => s.isActive).length
    
    // Simple top supplier logic (just picking the first active one for now as we don't have rating)
    let topSupplier = "Aucun"
    const activeSuppliers = suppliers.filter(s => s.isActive)
    if (activeSuppliers.length > 0) {
      topSupplier = activeSuppliers[0].name
    }

    return { 
      success: true, 
      data: {
        total,
        active,
        topSupplier,
        totalSpent: 0 // Placeholder as strictly speaking we need orders for this
      }
    }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return { success: false, error: "Failed to fetch stats" }
  }
}

export async function getSupplierById(id: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const supplier = await db.supplier.findUnique({
      where: { id, companyId: user.companyId }
    })

    if (!supplier) return { success: false, error: "Supplier not found" }

    // Also fetch orders
    const orders = await db.purchaseOrder.findMany({
      where: { supplierId: id, companyId: user.companyId },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: { ...supplier, orders } }
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return { success: false, error: "Failed to fetch supplier" }
  }
}

export async function createSupplier(data: any) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new Error("Supplier name is required")
    }

    const supplier = await db.supplier.create({
      data: {
        name: data.name.trim(),
        contactPerson: data.contactPerson?.trim() || null,
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        companyId: user.companyId,
        isActive: data.isActive ?? true,
        updatedAt: new Date()
      }
    })

    revalidatePath('/costs/suppliers')
    return { success: true, data: supplier }
  } catch (error) {
    console.error("Error creating supplier:", error)
    return { success: false, error: "Failed to create supplier" }
  }
}

export async function updateSupplier(id: string, data: any) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    const updateData: any = {
      updatedAt: new Date()
    }

    // Only update provided fields
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson?.trim()
    if (data.email !== undefined) updateData.email = data.email?.trim()
    if (data.phone !== undefined) updateData.phone = data.phone?.trim()
    if (data.address !== undefined) updateData.address = data.address?.trim()
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const supplier = await db.supplier.update({
      where: { id, companyId: user.companyId },
      data: updateData
    })

    revalidatePath('/costs/suppliers')
    revalidatePath(`/costs/suppliers/${id}`)
    return { success: true, data: supplier }
  } catch (error) {
    console.error("Error updating supplier:", error)
    return { success: false, error: "Failed to update supplier" }
  }
}

export async function deleteSupplier(id: string) {
  try {
    const user = await checkAuth()
    if (!user) throw new Error("Unauthorized")

    await db.supplier.delete({
      where: { id, companyId: user.companyId }
    })

    revalidatePath('/costs/suppliers')
    return { success: true }
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return { success: false, error: "Failed to delete supplier" }
  }
}
