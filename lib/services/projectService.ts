import { supabase } from '@/lib/supabase'

export interface Project {
  id: string
  name: string
  description: string | null
  client_name: string | null
  client_email?: string | null  // Ajoutez
  client_phone?: string | null 
  address: string | null
  city: string | null
  project_type: 'R+2' | 'Villa' | 'Immeuble' | 'Commercial' | 'Industrial' | 'Other'
  structure_type?: string | null 
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled'
  start_date: string | null
  planned_end_date: string | null
  actual_end_date?: string | null
  total_budget: number | null
  current_cost: number
  progress_percentage: number
  site_manager_id: string | null
  structural_engineer_id: string | null
  company_id: string
  created_by?: string | null
  created_at: string
  updated_at: string
  is_active?: boolean
  postal_code?: string | null
}

export interface ProjectWithDetails extends Project {
  site_manager: { first_name: string; last_name: string } | null
  structural_engineer: { first_name: string; last_name: string } | null
}

export const projectService = {
  // Récupérer tous les projets avec pagination
  async getProjects(page = 1, limit = 10, search = '', status = 'all') {
    let query = supabase
      .from('projects')
      .select(`
        *,
        site_manager:users!site_manager_id(first_name, last_name),
        structural_engineer:users!structural_engineer_id(first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    // Appliquer les filtres
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,client_name.ilike.%${search}%`)
    }
    
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error
    return { data, count }
  },

  // Récupérer un projet spécifique
  async getProject(id: string) {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        site_manager:users!site_manager_id(*),
        structural_engineer:users!structural_engineer_id(*),
        phases:project_phases(*),
        team:project_teams(
          user:users(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Créer un nouveau projet
  async createProject(projectData: Partial<Project>) {
  console.log('🚀 =========== DÉBUT CREATE PROJECT ===========')
  
  try {
    // Étape 1: Récupérer la session
    console.log('🔍 Étape 1/5: Récupération session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Erreur session:', sessionError)
      throw sessionError
    }
    
    console.log('✅ Session:', session ? 'OK' : 'NULL')
    
    if (!session) {
      throw new Error('Aucune session active')
    }
    
    const user = session.user
    console.log('👤 Utilisateur:', user.email)
    
    // Étape 2: Récupérer le profil
    console.log('🔍 Étape 2/5: Récupération profil utilisateur...')
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Erreur profil:', profileError)
      throw profileError
    }
    
    console.log('✅ Profil:', userProfile)
    
    if (!userProfile?.company_id) {
      throw new Error('Aucune entreprise associée')
    }
    
    // Étape 3: Préparer les données
    console.log('🔍 Étape 3/5: Préparation données...')
    const projectToInsert = {
      // Champs requis
      name: projectData.name || 'Nouveau projet',
      company_id: userProfile.company_id,
      
      // Champs optionnels de base
      description: projectData.description || null,
      client_name: projectData.client_name || null,
      client_email: projectData.client_email || null,
      client_phone: projectData.client_phone || null,
      address: projectData.address || null,
      city: projectData.city || null,
      postal_code: projectData.postal_code || null,
      project_type: projectData.project_type || 'R+2',
      status: projectData.status || 'planning',
      
      // Dates
      start_date: projectData.start_date || null,
      planned_end_date: projectData.planned_end_date || null,
      
      // Budget
      total_budget: projectData.total_budget || null,
      
      // Valeurs par défaut
      current_cost: 0,
      progress_percentage: 0,
      is_active: true,
      structure_type: null,
      site_manager_id: null,
      structural_engineer_id: null
    }
    
    console.log('📦 Données préparées:', JSON.stringify(projectToInsert, null, 2))
    
    // Étape 4: Tester une requête SELECT d'abord
    console.log('🔍 Étape 4/5: Test de connexion à la table...')
    const { data: testData, error: testError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    console.log('✅ Test connexion table:', testError ? `ERREUR: ${testError.message}` : 'OK')
    
    // Étape 5: Insérer le projet
    console.log('🔍 Étape 5/5: Insertion du projet...')
    console.log('URL:', `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/projects`)
    
    const { data, error } = await supabase
      .from('projects')
      .insert([projectToInsert])
      .select()
      .single()

    console.log('📡 Réponse Supabase:', { 
      hasData: !!data, 
      hasError: !!error,
      errorDetails: error 
    })
    
    if (error) {
      console.error('❌ Erreur détaillée:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      })
      
      // Essayer avec fetch directement pour voir
      console.log('🔄 Tentative avec fetch direct...')
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(projectToInsert)
        })
        
        const result = await response.text()
        console.log('📡 Réponse fetch:', response.status, result)
      } catch (fetchError) {
        console.error('❌ Erreur fetch:', fetchError)
      }
      
      throw error
    }
    
    console.log('✅ Projet créé avec succès:', data)
    console.log('🚀 =========== FIN CREATE PROJECT ===========')
    return data
    
  } catch (error: any) {
    console.error('💥 ERREUR FINALE dans createProject:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    throw error
  }
},

  // Mettre à jour un projet
  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Supprimer un projet (soft delete)
  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  },

  // Obtenir les statistiques des projets
  async getProjectStats() {
    const { data, error } = await supabase
      .from('projects')
      .select('status, total_budget, current_cost')

    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter(p => p.status === 'active').length,
      planning: data.filter(p => p.status === 'planning').length,
      completed: data.filter(p => p.status === 'completed').length,
      totalBudget: data.reduce((sum, p) => sum + (p.total_budget || 0), 0),
      totalCost: data.reduce((sum, p) => sum + (p.current_cost || 0), 0)
    }

    return stats
  },

  // Obtenir les phases d'un projet
  async getProjectPhases(projectId: string) {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) throw error
    return data
  },

  // Ajouter une équipe au projet
  async addTeamMember(projectId: string, userId: string, role: string) {
    const { data, error } = await supabase
      .from('project_teams')
      .insert([{
        project_id: projectId,
        user_id: userId,
        role_in_project: role
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }
}