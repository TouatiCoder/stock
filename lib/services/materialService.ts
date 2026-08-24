// lib/services/materialService.ts
import { getDb } from '@/lib/mysql/connection'

export interface Material {
  id: string
  name: string
  description?: string | null
  sku?: string | null 
  barcode?: string | null 
  category_id: string
  company_id: string
  unit_of_measure: 'kg' | 'ton' | 'm3' | 'm2' | 'm' | 'unit' | 'bag' | 'pallet' | 'other'
  unit_weight?: number | null 
  unit_price: number
  min_stock_level: number
  max_stock_level?: number | null
  critical_threshold: number
  current_stock: number
  reserved_stock: number
  total_value: number
  storage_location?: string | null 
  technical_specifications?: Record<string, any> | null 
  supplier_id?: string | null 
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProjectStock {
  id: string
  project_id: string
  material_id: string
  quantity: number
  allocated_quantity: number
  consumed_quantity: number
  min_level?: number
  last_updated: string
}

export interface MaterialWithStock extends Material {
  category?: { name: string }
  project_stock?: ProjectStock
  supplier?: { name: string }
}

export const materialService = {
  // Récupérer tous les matériaux d'un projet
  async getProjectMaterials(projectId: string) {
    const db = getDb();
    const result = await db.query(
      `SELECT ps.*, 
              m.name, m.unit_of_measure, m.current_stock, m.unit_price,
              mc.name as category_name,
              s.name as supplier_name
       FROM project_stock ps
       JOIN materials m ON ps.material_id = m.id
       LEFT JOIN material_categories mc ON m.category_id = mc.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE ps.project_id = ?
       ORDER BY ps.last_updated DESC`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les matériaux par catégorie
  async getMaterialsByCategory(categoryId: string) {
    const db = getDb();
    const result = await db.query(
      `SELECT m.*,
              mc.name as category_name
       FROM materials m
       LEFT JOIN material_categories mc ON m.category_id = mc.id
       WHERE m.category_id = ? AND m.is_active = 1
       ORDER BY m.name ASC`,
      [categoryId]
    )
    return result.rows
  },

  // Récupérer tous les matériaux d'une entreprise
  async getCompanyMaterials(companyId: string, filters?: {
    categoryId?: string
    search?: string
    lowStock?: boolean
  }) {
    let query = `SELECT m.*,
                        mc.name as category_name,
                        s.name as supplier_name
                 FROM materials m
                 LEFT JOIN material_categories mc ON m.category_id = mc.id
                 LEFT JOIN suppliers s ON m.supplier_id = s.id
                 WHERE m.company_id = ? AND m.is_active = 1`
    const params: any[] = [companyId]

    if (filters?.categoryId) {
      query += ` AND m.category_id = ?`
      params.push(filters.categoryId)
    }

    if (filters?.search) {
      query += ` AND (m.name LIKE ? OR m.sku LIKE ? OR m.description LIKE ?)`
      const searchParam = `%${filters.search}%`
      params.push(searchParam, searchParam, searchParam)
    }

    if (filters?.lowStock) {
      query += ` AND m.current_stock <= m.min_stock_level`
    }

    query += ` ORDER BY m.name ASC`

    const db = getDb();
    const result = await db.query(query, params)
    return result.rows
  },

  // Récupérer un matériau spécifique
  async getMaterial(id: string) {
    const db = getDb();
    const result = await db.query(
      `SELECT m.*,
              mc.name as category_name,
              mc.color_code as category_color_code,
              s.name as supplier_name,
              ps.id as project_stock_id,
              ps.project_id as project_stock_project_id,
              ps.quantity as project_stock_quantity,
              ps.allocated_quantity,
              ps.consumed_quantity,
              ps.min_level as project_stock_min_level,
              ps.last_updated as project_stock_last_updated,
              p.name as project_name
       FROM materials m
       LEFT JOIN material_categories mc ON m.category_id = mc.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       LEFT JOIN project_stock ps ON m.id = ps.material_id
       LEFT JOIN projects p ON ps.project_id = p.id
       WHERE m.id = ?`,
      [id]
    )
    return result.rows[0]
  },

  // Créer un nouveau matériau
  async createMaterial(material: Partial<Material>) {
    const db = getDb();
    const result = await db.query(
      `INSERT INTO materials (
         id, name, description, sku, barcode, category_id, company_id, 
         unit_of_measure, unit_weight, unit_price, min_stock_level, 
         max_stock_level, critical_threshold, current_stock, reserved_stock, 
         total_value, storage_location, technical_specifications, supplier_id, 
         is_active, created_at, updated_at
       ) VALUES (
         UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW()
       )`,
      [
        material.name,
        material.description || null,
        material.sku || null,
        material.barcode || null,
        material.category_id,
        material.company_id,
        material.unit_of_measure,
        material.unit_weight || null,
        material.unit_price,
        material.min_stock_level,
        material.max_stock_level || null,
        material.critical_threshold,
        material.current_stock || 0,
        material.reserved_stock || 0,
        material.total_value || 0,
        material.storage_location || null,
        material.technical_specifications ? JSON.stringify(material.technical_specifications) : null,
        material.supplier_id || null
      ]
    )

    // Get the newly created material
    const newMaterialResult = await db.query(
      `SELECT * FROM materials WHERE id = LAST_INSERT_ID()`,
      []
    )

    return newMaterialResult.rows[0]
  },

  // Mettre à jour un matériau
  async updateMaterial(id: string, updates: Partial<Material>) {
    const db = getDb();
    const updateFields = Object.keys(updates).filter(key => key !== 'id');
    if (updateFields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    const values = updateFields.map(field => (updates as any)[field]);
    values.push(id); // For WHERE clause

    await db.query(
      `UPDATE materials SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    )

    const result = await db.query(`SELECT * FROM materials WHERE id = ?`, [id])
    return result.rows[0]
  },

  // Mettre à jour le stock d'un matériau
  async updateStock(materialId: string, quantity: number) {
    const db = getDb();
    
    // Get the material to access unit price
    const materialResult = await db.query(
      `SELECT unit_price FROM materials WHERE id = ?`,
      [materialId]
    )
    
    if (materialResult.rows.length === 0) {
      throw new Error("Material not found");
    }

    const unitPrice = materialResult.rows[0].unit_price;
    const totalValue = (unitPrice || 0) * quantity;

    await db.query(
      `UPDATE materials 
       SET current_stock = ?, total_value = ?, updated_at = NOW() 
       WHERE id = ?`,
      [quantity, totalValue, materialId]
    )

    const result = await db.query(
      `SELECT * FROM materials WHERE id = ?`,
      [materialId]
    )
    return result.rows[0]
  },

  // Ajouter du stock à un projet
  async addToProjectStock(projectId: string, materialId: string, quantity: number) {
    const db = getDb();
    
    // Check if the record already exists
    const existingResult = await db.query(
      `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    )
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing record
      result = await db.query(
        `UPDATE project_stock 
         SET quantity = quantity + ?, last_updated = NOW() 
         WHERE project_id = ? AND material_id = ?`,
        [quantity, projectId, materialId]
      )
      
      // Get the updated record
      const updatedResult = await db.query(
        `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
        [projectId, materialId]
      )
      result = updatedResult.rows[0];
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO project_stock (id, project_id, material_id, quantity, allocated_quantity, consumed_quantity, last_updated)
         VALUES (UUID(), ?, ?, ?, 0, 0, NOW())`,
        [projectId, materialId, quantity]
      )
      
      // Get the new record
      const newResult = await db.query(
        `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
        [projectId, materialId]
      )
      result = newResult.rows[0];
    }
    
    return result
  },

  // Consommer du matériau dans un projet
  async consumeMaterial(projectId: string, materialId: string, quantity: number) {
    const db = getDb();
    
    // Get current stock and consumption
    const result = await db.query(
      `SELECT quantity, consumed_quantity 
       FROM project_stock 
       WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    )
    
    if (result.rows.length === 0) {
      throw new Error("Stock record not found");
    }
    
    const currentQuantity = result.rows[0].quantity;
    const currentConsumed = result.rows[0].consumed_quantity;
    
    if (currentQuantity < quantity) {
      throw new Error('Stock insuffisant');
    }

    // Update the stock record
    await db.query(
      `UPDATE project_stock 
       SET quantity = ?, consumed_quantity = ?, last_updated = NOW()
       WHERE project_id = ? AND material_id = ?`,
      [currentQuantity - quantity, currentConsumed + quantity, projectId, materialId]
    )

    // Get the updated record
    const updatedResult = await db.query(
      `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    )
    return updatedResult.rows[0]
  },

  // Récupérer les mouvements de stock d'un projet
  async getProjectStockMovements(projectId: string, limit: number = 20) {
    const db = getDb();
    const result = await db.query(
      `SELECT sm.*,
              m.name as material_name,
              m.unit_of_measure as material_unit,
              u.first_name as user_first_name,
              u.last_name as user_last_name
       FROM stock_movements sm
       LEFT JOIN materials m ON sm.material_id = m.id
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.project_id = ?
       ORDER BY sm.movement_date DESC
       LIMIT ?`,
      [projectId, limit]
    )
    return result.rows
  },

  // Vérifier le niveau de stock
  checkStockLevel(material: Material): 'normal' | 'low' | 'critical' {
    if (material.current_stock <= material.critical_threshold) {
      return 'critical'
    } else if (material.current_stock <= material.min_stock_level) {
      return 'low'
    }
    return 'normal'
  },

  // Calculer la valeur totale du stock
  calculateTotalValue(materials: Material[]): number {
    return materials.reduce((total, material) => {
      return total + (material.total_value || 0)
    }, 0)
  }
}