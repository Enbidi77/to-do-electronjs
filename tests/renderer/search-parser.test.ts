import { describe, it, expect } from 'vitest'
import { parseSearchQuery } from '../../src/renderer/src/lib/search-parser'

describe('SearchParser', () => {
  it('should parse plain text', () => {
    const result = parseSearchQuery('buy groceries')
    expect(result.text).toBe('buy groceries')
    expect(Object.keys(result.filters).length).toBe(0)
  })

  it('should parse is:completed and is:active', () => {
    const completed = parseSearchQuery('finish slides is:completed')
    expect(completed.text).toBe('finish slides')
    expect(completed.filters.status).toBe('completed')

    const active = parseSearchQuery('is:active write report')
    expect(active.text).toBe('write report')
    expect(active.filters.status).toBe('active')
  })

  it('should parse priority:high and other priorities', () => {
    const high = parseSearchQuery('urgent bug fix priority:high')
    expect(high.text).toBe('urgent bug fix')
    expect(high.filters.priority).toBe('high')

    const urgent = parseSearchQuery('priority:urgent server down')
    expect(urgent.text).toBe('server down')
    expect(urgent.filters.priority).toBe('urgent')
  })

  it('should parse project:work and tag:dev', () => {
    const result = parseSearchQuery('fix auth project:backend tag:security')
    expect(result.text).toBe('fix auth')
    expect(result.filters.projectId).toBe('backend')
    expect(result.filters.tagId).toBe('security')
  })

  it('should parse due:today, due:tomorrow, and due:overdue', () => {
    const today = parseSearchQuery('call mom due:today')
    expect(today.text).toBe('call mom')
    expect(today.filters.dueDateFrom).toBeDefined()
    expect(today.filters.dueDateTo).toBe(today.filters.dueDateFrom)

    const overdue = parseSearchQuery('taxes due:overdue')
    expect(overdue.text).toBe('taxes')
    expect(overdue.filters.isOverdue).toBe(true)
  })

  it('should parse combined complex search query', () => {
    const query = 'prepare presentation is:active priority:urgent project:work due:today'
    const result = parseSearchQuery(query)
    expect(result.text).toBe('prepare presentation')
    expect(result.filters.status).toBe('active')
    expect(result.filters.priority).toBe('urgent')
    expect(result.filters.projectId).toBe('work')
    expect(result.filters.dueDateFrom).toBeDefined()
  })
})
