// services/projectDetailService.ts
import { getDb } from '@/lib/mysql/connection'

export const projectDetailService = {
  // Récupérer les calculs structurels d'un projet
  async getStructuralCalculations(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT sc.*, 
              u.first_name as engineer_first_name,
              u.last_name as engineer_last_name,
              ci.id as item_id,
              ci.description as item_description,
              ci.quantity as item_quantity,
              ci.unit as item_unit,
              ci.created_at as item_created_at
       FROM structural_calculations sc
       LEFT JOIN users u ON sc.engineer_id = u.id
       LEFT JOIN calculation_items ci ON sc.id = ci.calculation_id
       WHERE sc.project_id = ?
       ORDER BY sc.created_at DESC`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les matériaux du projet
  async getProjectMaterials(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT ps.*,
              m.name as material_name,
              m.description as material_description,
              m.unit as material_unit,
              m.unit_price as material_unit_price,
              m.category as material_category,
              mc.name as category_name
       FROM project_stock ps
       JOIN materials m ON ps.material_id = m.id
       LEFT JOIN material_categories mc ON m.category = mc.id
       WHERE ps.project_id = ?`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les mouvements de stock du projet
  async getProjectStockMovements(projectId: string) {
    const db = getDb()
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
       LIMIT 20`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les anomalies du projet
  async getProjectAnomalies(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT a.*,
              reporter.first_name as reported_by_first_name,
              reporter.last_name as reported_by_last_name,
              assignee.first_name as assigned_to_first_name,
              assignee.last_name as assigned_to_last_name
       FROM anomalies a
       LEFT JOIN users reporter ON a.reported_by = reporter.id
       LEFT JOIN users assignee ON a.assigned_to = assignee.id
       WHERE a.project_id = ?
       ORDER BY a.created_at DESC`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les checklists du projet
  async getProjectChecklists(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT c.*,
              pp.name as phase_name,
              u.first_name as completed_by_first_name,
              u.last_name as completed_by_last_name
       FROM checklists c
       LEFT JOIN project_phases pp ON c.phase_id = pp.id
       LEFT JOIN users u ON c.completed_by = u.id
       WHERE c.project_id = ?
       ORDER BY c.created_at DESC`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les documents techniques
  async getProjectDocuments(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT td.*,
              u.first_name as uploaded_by_first_name,
              u.last_name as uploaded_by_last_name
       FROM technical_documents td
       LEFT JOIN users u ON td.uploaded_by = u.id
       WHERE td.project_id = ?
       ORDER BY td.created_at DESC`,
      [projectId]
    )
    return result.rows
  },

  // Récupérer les commandes liées au projet
  async getProjectPurchaseOrders(projectId: string) {
    const db = getDb()
    const result = await db.query(
      `SELECT po.*,
              s.name as supplier_name
       FROM purchase_orders po
       LEFT JOIN suppliers s ON po.supplier_id = s.id
       WHERE po.project_id = ?
       ORDER BY po.order_date DESC`,
      [projectId]
    )
    return result.rows
  },

  // Ajouter un calcul structurel
  async addStructuralCalculation(projectId: string, calculationData: any) {
    const db = getDb()
    const result = await db.query(
      `INSERT INTO structural_calculations (
         id, project_id, name, description, calculation_type, 
         engineer_id, version, status, created_at, updated_at
       ) VALUES (
         UUID(), ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
       )`,
      [
        projectId,
        calculationData.name || null,
        calculationData.description || null,
        calculationData.calculation_type || null,
        calculationData.engineer_id || null,
        calculationData.version || 1,
        calculationData.status || 'draft'
      ]
    )
    
    // Return the newly created calculation
    const newCalcResult = await db.query(
      `SELECT * FROM structural_calculations WHERE id = ?`,
      [result.insertId]
    )
    return newCalcResult.rows[0]
  },

  // Mettre à jour le stock du projet
  async updateProjectStock(projectId: string, materialId: string, quantity: number) {
    const db = getDb()
    
    // Check if a record already exists
    const existingResult = await db.query(
      `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
      [projectId, materialId]
    )
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing record
      result = await db.query(
        `UPDATE project_stock 
         SET quantity = ?, last_updated = NOW() 
         WHERE project_id = ? AND material_id = ?`,
        [quantity, projectId, materialId]
      )
      
      // Return the updated record
      const updatedResult = await db.query(
        `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
        [projectId, materialId]
      )
      result = updatedResult.rows[0]
    } else {
      // Insert new record
      await db.query(
        `INSERT INTO project_stock (
           id, project_id, material_id, quantity, allocated_quantity, 
           consumed_quantity, min_level, last_updated
         ) VALUES (
           UUID(), ?, ?, ?, 0, 0, 0, NOW()
         )`,
        [projectId, materialId, quantity]
      )
      
      // Return the new record
      const newResult = await db.query(
        `SELECT * FROM project_stock WHERE project_id = ? AND material_id = ?`,
        [projectId, materialId]
      )
      result = newResult.rows[0]
    }
    
    return result
  },

  // Créer un mouvement de stock
  async createStockMovement(movementData: any) {
    const db = getDb()
    const result = await db.query(
      `INSERT INTO stock_movements (
         id, project_id, material_id, user_id, movement_type, 
         quantity, description, movement_date
       ) VALUES (
         UUID(), ?, ?, ?, ?, ?, ?, NOW()
       )`,
      [
        movementData.project_id,
        movementData.material_id,
        movementData.user_id,
        movementData.movement_type,
        movementData.quantity,
        movementData.description || null
      ]
    )
    
    // Return the newly created movement
    const newMovementResult = await db.query(
      `SELECT * FROM stock_movements WHERE id = ?`,
      [result.insertId]
    )
    return newMovementResult.rows[0]
  }
}