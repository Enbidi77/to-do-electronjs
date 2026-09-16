// ============================================================================
// Project Types
// ============================================================================

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectInput {
  name: string
  description?: string | null
  color?: string
  icon?: string | null
  sortOrder?: number
}

export interface UpdateProjectInput {
  name?: string
  description?: string | null
  color?: string
  icon?: string | null
  sortOrder?: number
}

