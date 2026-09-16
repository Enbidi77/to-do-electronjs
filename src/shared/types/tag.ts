// ============================================================================
// Tag Types
// ============================================================================

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: string
}

export interface CreateTagInput {
  name: string
  color?: string
}

export interface UpdateTagInput {
  name?: string
  color?: string
}

