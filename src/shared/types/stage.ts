// ============================================================================
// Stage Types
// ============================================================================

export interface Stage {
  id: string
  name: string
  color: string
  icon?: string | null
  sortOrder: number
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateStageInput {
  name: string
  color?: string
  icon?: string | null
  sortOrder?: number
  isCompleted?: boolean
}

export interface UpdateStageInput {
  name?: string
  color?: string
  icon?: string | null
  sortOrder?: number
  isCompleted?: boolean
}
