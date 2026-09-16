import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow, parseISO } from 'date-fns'
import { vi, enUS } from 'date-fns/locale'
import i18n from '@/i18n'

export function getDateFnsLocale() {
  return i18n.language === 'vi' ? vi : enUS
}

export function toDate(date: string | Date | number): Date {
  if (date instanceof Date) return date
  if (typeof date === 'string') return parseISO(date)
  return new Date(date)
}

/**
 * Formats a date using date-fns format tokens with current locale
 */
export function formatLocalized(date: string | Date | number, formatStr: string): string {
  return format(toDate(date), formatStr, { locale: getDateFnsLocale() })
}

/**
 * Returns full readable date:
 * en: "September 16, 2026"
 * vi: "16 tháng 9, 2026"
 */
export function formatFullDate(date: string | Date | number): string {
  const d = toDate(date)
  if (i18n.language === 'vi') {
    return format(d, "d 'tháng' M, yyyy", { locale: vi })
  }
  return format(d, 'MMMM d, yyyy', { locale: enUS })
}

/**
 * Returns full date with weekday:
 * en: "Wednesday, September 16, 2026"
 * vi: "Thứ Tư, 16 tháng 9, 2026"
 */
export function formatHeaderDate(date: string | Date | number): string {
  const d = toDate(date)
  if (i18n.language === 'vi') {
    return format(d, "EEEE, d 'tháng' M, yyyy", { locale: vi })
  }
  return format(d, 'EEEE, MMMM d, yyyy', { locale: enUS })
}

/**
 * Formats time:
 * en: "3:30 PM"
 * vi: "15:30"
 */
export function formatLocalizedTime(date: string | Date | number): string {
  const d = toDate(date)
  if (i18n.language === 'vi') {
    return format(d, 'HH:mm', { locale: vi })
  }
  return format(d, 'h:mm a', { locale: enUS })
}

/**
 * Formats task due date badge:
 * - If today: "Today" / "Hôm nay"
 * - If tomorrow: "Tomorrow" / "Ngày mai"
 * - If yesterday: "Yesterday" / "Hôm qua"
 * - Otherwise: "Sep 16" / "16 thg 9"
 */
export function formatRelativeDueDate(date: string | Date | number): string {
  const d = toDate(date)
  if (isToday(d)) {
    return i18n.t('tasks:groups.today')
  }
  if (isTomorrow(d)) {
    return i18n.t('tasks:groups.tomorrow')
  }
  if (isYesterday(d)) {
    return i18n.t('common:time.yesterday')
  }
  if (i18n.language === 'vi') {
    return format(d, "d 'thg' M", { locale: vi })
  }
  return format(d, 'MMM d', { locale: enUS })
}

/**
 * Relative time ago:
 * en: "just now", "5 minutes ago", "1 hour ago"
 * vi: "vừa xong", "5 phút trước", "1 giờ trước"
 */
export function formatRelativeTime(date: string | Date | number): string {
  const d = toDate(date)
  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) {
    return i18n.t('common:time.justNow')
  }

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return i18n.t('common:time.minutesAgo', { count: diffMin })
  }

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) {
    return i18n.t('common:time.hoursAgo', { count: diffHours })
  }

  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: getDateFnsLocale()
  })
}

