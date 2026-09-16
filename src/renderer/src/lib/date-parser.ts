import * as chrono from 'chrono-node'
import type { TaskPriority } from '@shared/types'
import { addDays, setHours, setMinutes, startOfDay } from 'date-fns'

export interface ParsedTaskInput {
  title: string
  dueDate: Date | null
  dueTime: string | null
  tags: string[]
  priority: TaskPriority
  projectName: string | null
}

interface DateExtractionResult {
  date: Date
  time: string | null
  matchedText: string
}

const VI_WEEKDAYS: Record<string, number> = {
  'chủ nhật': 0,
  'chu nhat': 0,
  'cn': 0,
  'thứ hai': 1,
  'thu hai': 1,
  'thứ 2': 1,
  'thu 2': 1,
  'thứ ba': 2,
  'thu ba': 2,
  'thứ 3': 2,
  'thu 3': 2,
  'thứ tư': 3,
  'thu tu': 3,
  'thứ 4': 3,
  'thu 4': 3,
  'thứ năm': 4,
  'thu nam': 4,
  'thứ 5': 4,
  'thu 5': 4,
  'thứ sáu': 5,
  'thu sau': 5,
  'thứ 6': 5,
  'thu 6': 5,
  'thứ bảy': 6,
  'thu bay': 6,
  'thứ 7': 6,
  'thu 7': 6
}

function findUnicodePhrase(text: string, phrase: string): { index: number; length: number; match: string } | null {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})($|[^\\p{L}\\p{N}])`, 'iu')
  const m = text.match(regex)
  if (!m || m.index === undefined) return null
  const prefixLen = m[1].length
  return {
    index: m.index + prefixLen,
    length: m[2].length,
    match: m[2]
  }
}

function parseVietnameseTime(timeStr: string): { hours: number; minutes: number; text: string } | null {
  // Try pattern with explicit units: "lúc 15h30", "15h30", "15h", "10:30", "10 giờ 30 phút", "10 giờ"
  const timeRegex = /^(?:(?:lúc|vào lúc|vao luc)\s+)?(\d{1,2})(?:(?::(\d{2}))|(?:h(\d{1,2})?)|(?:\s*giờ(?:\s*(\d{1,2}))?(?:\s*phút)?))(?:\s*(sáng|chiều|tối|am|pm))?/i
  const match = timeStr.match(timeRegex)

  if (match) {
    let hours = parseInt(match[1], 10)
    let minutes = 0

    if (match[2] !== undefined) {
      minutes = parseInt(match[2], 10)
    } else if (match[3] !== undefined && match[3] !== '') {
      minutes = parseInt(match[3], 10)
    } else if (match[4] !== undefined && match[4] !== '') {
      minutes = parseInt(match[4], 10)
    }

    const period = match[5]?.toLowerCase()
    if (period) {
      if ((period === 'chiều' || period === 'tối' || period === 'pm') && hours < 12) {
        hours += 12
      } else if ((period === 'sáng' || period === 'am') && hours === 12) {
        hours = 0
      }
    }

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return { hours, minutes, text: match[0] }
    }
  }

  // Also support simple "lúc 10" or "lúc 3 chiều"
  const simpleTimeRegex = /^(?:lúc|vào lúc|vao luc)\s+(\d{1,2})(?:\s*(sáng|chiều|tối|am|pm))?/i
  const simpleMatch = timeStr.match(simpleTimeRegex)
  if (simpleMatch) {
    let hours = parseInt(simpleMatch[1], 10)
    const period = simpleMatch[2]?.toLowerCase()
    if (period) {
      if ((period === 'chiều' || period === 'tối' || period === 'pm') && hours < 12) {
        hours += 12
      } else if ((period === 'sáng' || period === 'am') && hours === 12) {
        hours = 0
      }
    }
    if (hours >= 0 && hours < 24) {
      return { hours, minutes: 0, text: simpleMatch[0] }
    }
  }

  return null
}

function parseVietnameseDate(input: string, referenceDate: Date = new Date()): DateExtractionResult | null {
  // 1. Check relative day expressions: "hôm nay", "ngày mai", "mai", "ngày kia", "ngày mốt"
  const relativePhrases = [
    { phrase: 'hôm nay', days: 0 },
    { phrase: 'hom nay', days: 0 },
    { phrase: 'ngày mai', days: 1 },
    { phrase: 'ngay mai', days: 1 },
    { phrase: 'mai', days: 1 },
    { phrase: 'ngày kia', days: 2 },
    { phrase: 'ngay kia', days: 2 },
    { phrase: 'ngày mốt', days: 2 },
    { phrase: 'ngay mot', days: 2 }
  ]

  for (const rel of relativePhrases) {
    const found = findUnicodePhrase(input, rel.phrase)
    if (found) {
      let targetDate = startOfDay(addDays(referenceDate, rel.days))
      let matchedText = found.match

      // Check trailing time: e.g. "ngày mai lúc 15h"
      const afterMatch = input.slice(found.index + found.length).trim()
      const timeInfo = parseVietnameseTime(afterMatch)

      let dueTime: string | null = null
      if (timeInfo && afterMatch.startsWith(timeInfo.text)) {
        targetDate = setMinutes(setHours(targetDate, timeInfo.hours), timeInfo.minutes)
        dueTime = `${timeInfo.hours.toString().padStart(2, '0')}:${timeInfo.minutes.toString().padStart(2, '0')}`
        const afterStartIndex = input.indexOf(afterMatch, found.index + found.length)
        matchedText = input.slice(found.index, afterStartIndex + timeInfo.text.length)
      }

      return {
        date: targetDate,
        time: dueTime,
        matchedText
      }
    }
  }

  // 2. Check weekday expressions: "thứ hai", "thứ 2", "chủ nhật"
  for (const [key, targetWeekday] of Object.entries(VI_WEEKDAYS)) {
    const found = findUnicodePhrase(input, key)
    if (found) {
      let diff = targetWeekday - referenceDate.getDay()
      if (diff <= 0) diff += 7

      // Check for "tuần sau"
      let searchOffset = found.index + found.length
      const afterWeekday = input.slice(searchOffset).trim()
      const nextWeekMatch = afterWeekday.match(/^(?:tuần sau|tuan sau|tuần tới|tuan toi)/i)

      let matchedEnd = found.index + found.length
      if (nextWeekMatch) {
        diff += 7
        matchedEnd += input.slice(searchOffset).indexOf(nextWeekMatch[0]) + nextWeekMatch[0].length
        searchOffset = matchedEnd
      }

      let targetDate = startOfDay(addDays(referenceDate, diff))

      // Check for time: e.g. "lúc 10 giờ"
      const afterMatch = input.slice(matchedEnd).trim()
      const timeInfo = parseVietnameseTime(afterMatch)
      let dueTime: string | null = null

      if (timeInfo && afterMatch.startsWith(timeInfo.text)) {
        targetDate = setMinutes(setHours(targetDate, timeInfo.hours), timeInfo.minutes)
        dueTime = `${timeInfo.hours.toString().padStart(2, '0')}:${timeInfo.minutes.toString().padStart(2, '0')}`
        const afterStartIndex = input.indexOf(afterMatch, matchedEnd)
        matchedEnd = afterStartIndex + timeInfo.text.length
      }

      return {
        date: targetDate,
        time: dueTime,
        matchedText: input.slice(found.index, matchedEnd)
      }
    }
  }

  // 3. Standalone time: "lúc 15h" or "lúc 10:00" -> applies to today or tomorrow if passed
  const timeRegex = /(?:^|[^\p{L}\p{N}])((?:lúc|vào lúc|vao luc)\s+\d{1,2}(?::\d{2}|h\d{0,2}|\s*giờ(?:\s*\d{1,2})?(?:\s*phút)?)(?:\s*(?:sáng|chiều|tối|am|pm))?)/iu
  const standaloneMatch = input.match(timeRegex)
  if (standaloneMatch && standaloneMatch.index !== undefined) {
    const matchedText = standaloneMatch[1]
    const timeInfo = parseVietnameseTime(matchedText)
    if (timeInfo) {
      let targetDate = setMinutes(setHours(startOfDay(referenceDate), timeInfo.hours), timeInfo.minutes)
      if (targetDate < referenceDate) {
        targetDate = addDays(targetDate, 1)
      }
      return {
        date: targetDate,
        time: `${timeInfo.hours.toString().padStart(2, '0')}:${timeInfo.minutes.toString().padStart(2, '0')}`,
        matchedText
      }
    }
  }

  return null
}

export function parseTaskInput(input: string): ParsedTaskInput {
  let title = input
  const tags: string[] = []
  let priority: TaskPriority = 'none'
  let projectName: string | null = null
  let dueDate: Date | null = null
  let dueTime: string | null = null

  // 1. Extract tags (#tagname)
  const tagRegex = /#([\w-]+)/g
  const tagMatches = [...title.matchAll(tagRegex)]
  tagMatches.forEach(match => {
    tags.push(match[1])
  })
  title = title.replace(tagRegex, '').trim()

  // 2. Extract project (/projectname)
  const projectRegex = /\/([\w-]+)/g
  const projectMatches = [...title.matchAll(projectRegex)]
  if (projectMatches.length > 0) {
    projectName = projectMatches[projectMatches.length - 1][1]
    title = title.replace(projectRegex, '').trim()
  }

  // 3. Extract priority keywords (English & Vietnamese Unicode safe)
  const priorityPatterns = [
    { regex: /(?:^|[^\p{L}\p{N}])(priority\s*:\s*urgent|ưu tiên\s*:\s*khẩn cấp|ưu tiên\s+khẩn cấp|khẩn cấp|!!!)(?:$|[^\p{L}\p{N}])/iu, level: 'urgent' as TaskPriority },
    { regex: /(?:^|[^\p{L}\p{N}])(priority\s*:\s*high|ưu tiên\s*:\s*cao|ưu tiên\s+cao|!!)(?:$|[^\p{L}\p{N}])/iu, level: 'high' as TaskPriority },
    { regex: /(?:^|[^\p{L}\p{N}])(priority\s*:\s*medium|ưu tiên\s*:\s*trung bình|ưu tiên\s+trung bình|!)(?:$|[^\p{L}\p{N}])/iu, level: 'medium' as TaskPriority },
    { regex: /(?:^|[^\p{L}\p{N}])(priority\s*:\s*low|ưu tiên\s*:\s*thấp|ưu tiên\s+thấp)(?:$|[^\p{L}\p{N}])/iu, level: 'low' as TaskPriority }
  ]

  for (const item of priorityPatterns) {
    const match = title.match(item.regex)
    if (match) {
      priority = item.level
      title = title.replace(match[1], '').trim()
      break
    }
  }

  // 4. Try parsing Vietnamese date expressions
  const viResult = parseVietnameseDate(title)
  if (viResult) {
    dueDate = viResult.date
    dueTime = viResult.time
    title = title.replace(viResult.matchedText, '').replace(/\s+/g, ' ').trim()
  } else {
    // 5. Fallback to English Chrono parser
    const chronoResults = chrono.parse(title, new Date(), { forwardDate: true })
    if (chronoResults.length > 0) {
      const result = chronoResults[0]
      const idx = title.indexOf(result.text)
      const charBefore = idx > 0 ? title[idx - 1] : ' '
      const charAfter = idx + result.text.length < title.length ? title[idx + result.text.length] : ' '
      const isFalseMatch = /[\p{L}\p{N}]/u.test(charBefore) || /[\p{L}\p{N}]/u.test(charAfter)

      if (!isFalseMatch) {
        dueDate = result.start.date()

        if (result.start.isCertain('hour')) {
          const hours = result.start.get('hour')
          const minutes = result.start.get('minute') ?? 0
          if (hours !== null) {
            dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          }
        }

        title = title.replace(result.text, '').replace(/\s+/g, ' ').trim()
      }
    }
  }

  return {
    title,
    dueDate,
    dueTime,
    tags,
    priority,
    projectName
  }
}
