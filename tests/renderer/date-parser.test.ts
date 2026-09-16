import { describe, it, expect } from 'vitest'
import { parseTaskInput } from '../../src/renderer/src/lib/date-parser'

describe('parseTaskInput bilingual parser', () => {
  describe('English parsing', () => {
    it('parses English relative dates and times', () => {
      const result = parseTaskInput('Finish report tomorrow at 3pm')
      expect(result.title).toBe('Finish report')
      expect(result.dueDate).not.toBeNull()
      expect(result.dueTime).toBe('15:00')
    })

    it('parses English tags and priorities', () => {
      const result = parseTaskInput('Fix critical bug priority:urgent #bug /engineering')
      expect(result.title).toBe('Fix critical bug')
      expect(result.priority).toBe('urgent')
      expect(result.tags).toEqual(['bug'])
      expect(result.projectName).toBe('engineering')
    })
  })

  describe('Vietnamese parsing', () => {
    it('parses Vietnamese tomorrow with hour', () => {
      const result = parseTaskInput('Hoàn thành báo cáo ngày mai lúc 15h')
      expect(result.title).toBe('Hoàn thành báo cáo')
      expect(result.dueDate).not.toBeNull()
      expect(result.dueTime).toBe('15:00')
    })

    it('parses Vietnamese weekday and time', () => {
      const result = parseTaskInput('Họp thứ Sáu lúc 10 giờ')
      expect(result.title).toBe('Họp')
      expect(result.dueDate).not.toBeNull()
      expect(result.dueTime).toBe('10:00')
    })

    it('parses Vietnamese today with minute', () => {
      const result = parseTaskInput('Gửi tài liệu hôm nay lúc 15h30')
      expect(result.title).toBe('Gửi tài liệu')
      expect(result.dueDate).not.toBeNull()
      expect(result.dueTime).toBe('15:30')
    })

    it('parses Vietnamese priority and tags', () => {
      const result = parseTaskInput('Nộp báo cáo thuế ưu tiên:cao #taichinh /ke-toan')
      expect(result.title).toBe('Nộp báo cáo thuế')
      expect(result.priority).toBe('high')
      expect(result.tags).toEqual(['taichinh'])
      expect(result.projectName).toBe('ke-toan')
    })
  })
})

