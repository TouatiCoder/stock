export type UserRole = "admin" | "chef_de_chantier" | "ingenieur_structure"

export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  created_by: string
  assigned_to: string[]
  status: "active" | "completed" | "on_hold" | "cancelled"
  location: string | null
  budget_mad: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}
export interface ProjectData {
  id: string
  name: string
  budget_mad: number
  spent_mad: number
}

export interface InventoryItem {
  id: string
  name: string
  description: string | null
  sku: string
  category: string
  quantity_on_hand: number
  unit: string
  unit_cost_mad: number
  reorder_level: number
  supplier_id: string | null
  created_at: string
  updated_at: string
}

export interface Calculation {
  id: string
  project_id: string
  created_by: string
  title: string
  description: string | null
  calculation_type: string
  parameters: Record<string, any>
  results: Record<string, any> | null
  status: "draft" | "completed" | "reviewed" | "approved"
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string
  contact_person: string | null
  payment_terms: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  project_id: string
  description: string
  category: string
  amount_mad: number
  supplier_id: string | null
  date: string
  created_by: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string | null
  changes: Record<string, any> | null
  created_at: string
}
