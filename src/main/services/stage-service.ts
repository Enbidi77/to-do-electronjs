import { db } from '../database/connection'
import { stages, tasks } from '../database/schema'
import { eq, asc, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { Stage, CreateStageInput, UpdateStageInput } from '@shared/types'
import { createLogger } from '../system/logger'

const logger = createLogger('StageService')

export class StageService {
  list(): Stage[] {
    const rows = db.select().from(stages).orderBy(asc(stages.sortOrder)).all()
    return rows.map(r => ({
      ...r,
      color: r.color || '#64748b',
      icon: r.icon || 'circle',
      isCompleted: Boolean(r.isCompleted),
      sortOrder: r.sortOrder ?? 0,
      createdAt: r.createdAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString()
    }))
  }

  get(id: string): Stage | null {
    const row = db.select().from(stages).where(eq(stages.id, id)).get()
    if (!row) return null
    return {
      ...row,
      color: row.color || '#64748b',
      icon: row.icon || 'circle',
      isCompleted: Boolean(row.isCompleted),
      sortOrder: row.sortOrder ?? 0,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString()
    }
  }

  create(input: CreateStageInput): Stage {
    const now = new Date().toISOString()
    const id = nanoid()

    // Determine sort order if not specified
    let sortOrder = input.sortOrder
    if (sortOrder === undefined) {
      const maxRow = db
        .select({ maxOrder: stages.sortOrder })
        .from(stages)
        .orderBy(desc(stages.sortOrder))
        .limit(1)
        .get()
      sortOrder = (maxRow?.maxOrder ?? 0) + 1000
    }

    const newStage = {
      id,
      name: input.name.trim(),
      color: input.color || '#64748b',
      icon: input.icon || 'circle',
      sortOrder,
      isCompleted: input.isCompleted ? 1 : 0,
      createdAt: now,
      updatedAt: now
    }

    db.insert(stages).values(newStage).run()
    logger.info(`Stage created: ${id} - ${input.name}`)
    return this.get(id)!
  }

  update(id: string, input: UpdateStageInput): Stage {
    const stage = this.get(id)
    if (!stage) throw new Error(`Stage not found: ${id}`)

    const now = new Date().toISOString()
    const updateData: Partial<typeof stages.$inferInsert> = {
      updatedAt: now
    }

    if (input.name !== undefined) updateData.name = input.name.trim()
    if (input.color !== undefined) updateData.color = input.color
    if (input.icon !== undefined) updateData.icon = input.icon
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder
    if (input.isCompleted !== undefined) updateData.isCompleted = input.isCompleted ? 1 : 0

    db.update(stages).set(updateData).where(eq(stages.id, id)).run()
    logger.info(`Stage updated: ${id}`)
    return this.get(id)!
  }

  delete(id: string, fallbackStageId?: string): void {
    const allStages = this.list()
    if (allStages.length <= 1) {
      throw new Error('Cannot delete the only remaining stage')
    }

    // Identify target fallback stage for existing tasks
    let fallback = fallbackStageId ? allStages.find(s => s.id === fallbackStageId) : null
    if (!fallback) {
      fallback = allStages.find(s => s.id !== id && !s.isCompleted) || allStages.find(s => s.id !== id) || null
    }

    if (fallback) {
      const now = new Date().toISOString()
      if (fallback.isCompleted) {
        db.update(tasks)
          .set({ status: fallback.id, completedAt: now, updatedAt: now })
          .where(eq(tasks.status, id))
          .run()
      } else {
        db.update(tasks)
          .set({ status: fallback.id, completedAt: null, updatedAt: now })
          .where(eq(tasks.status, id))
          .run()
      }
    }

    db.delete(stages).where(eq(stages.id, id)).run()
    logger.info(`Stage deleted: ${id}, tasks moved to: ${fallback?.id}`)
  }

  reorder(ids: string[]): void {
    const now = new Date().toISOString()
    ids.forEach((id, index) => {
      db.update(stages)
        .set({ sortOrder: (index + 1) * 1000, updatedAt: now })
        .where(eq(stages.id, id))
        .run()
    })
    logger.info(`Stages reordered: ${ids.length} stages`)
  }
}

export const stageService = new StageService()
