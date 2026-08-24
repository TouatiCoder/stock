// lib/services/warehouseService.ts
import { db } from '@/lib/db'
import { Warehouse as PrismaWarehouse } from '@prisma/client'

// Use the Prisma-generated type directly
type Warehouse = PrismaWarehouse

export const warehouseService = {
  // Récupérer tous les dépôts d'une entreprise
  async getCompanyWarehouses(companyId: string): Promise<Warehouse[]> {
    try {
      const warehouses = await db.warehouse.findMany({
        where: { companyId },
        orderBy: { name: 'asc' }
      })
      return warehouses
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      throw error
    }
  },

  // Récupérer un dépôt par ID
  async getWarehouseById(id: string): Promise<Warehouse | null> {
    try {
      const warehouse = await db.warehouse.findUnique({
        where: { id }
      })
      return warehouse
    } catch (error) {
      console.error('Error fetching warehouse:', error)
      return null
    }
  },

  // Créer un nouveau dépôt
  async createWarehouse(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>): Promise<Warehouse> {
    try {
      const warehouse = await db.warehouse.create({
        data: {
          ...warehouseData,
          companyId: warehouseData.companyId,
          updatedAt: new Date()
        }
      })

      return warehouse
    } catch (error) {
      console.error('Error creating warehouse:', error)
      throw error
    }
  },

  // Mettre à jour un dépôt
  async updateWarehouse(id: string, updates: Partial<Warehouse>): Promise<Warehouse> {
    try {
      const warehouse = await db.warehouse.update({
        where: { id },
        data: updates
      })

      return warehouse
    } catch (error) {
      console.error('Error updating warehouse:', error)
      throw error
    }
  },

  // Supprimer un dépôt
  async deleteWarehouse(id: string): Promise<void> {
    try {
      await db.warehouse.delete({
        where: { id }
      })
    } catch (error) {
      console.error('Error deleting warehouse:', error)
      throw error
    }
  },

  // Récupérer le premier dépôt (comme principal)
  async getMainWarehouse(companyId: string): Promise<Warehouse | null> {
    try {
      const warehouse = await db.warehouse.findFirst({
        where: { companyId },
        orderBy: { name: 'asc' }
      })
      return warehouse
    } catch (error) {
      console.error('Error fetching main warehouse:', error)
      return null
    }
  }
}