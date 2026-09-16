import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { Resources, SupportedLanguage } from './types'

import commonEn from './locales/en/common.json'
import tasksEn from './locales/en/tasks.json'
import projectsEn from './locales/en/projects.json'
import remindersEn from './locales/en/reminders.json'
import settingsEn from './locales/en/settings.json'
import navigationEn from './locales/en/navigation.json'
import notificationsEn from './locales/en/notifications.json'
import errorsEn from './locales/en/errors.json'

import commonVi from './locales/vi/common.json'
import tasksVi from './locales/vi/tasks.json'
import projectsVi from './locales/vi/projects.json'
import remindersVi from './locales/vi/reminders.json'
import settingsVi from './locales/vi/settings.json'
import navigationVi from './locales/vi/navigation.json'
import notificationsVi from './locales/vi/notifications.json'
import errorsVi from './locales/vi/errors.json'

export const defaultNS = 'common'
export const resources = {
  en: {
    common: commonEn,
    tasks: tasksEn,
    projects: projectsEn,
    reminders: remindersEn,
    settings: settingsEn,
    navigation: navigationEn,
    notifications: notificationsEn,
    errors: errorsEn
  },
  vi: {
    common: commonVi,
    tasks: tasksVi,
    projects: projectsVi,
    reminders: remindersVi,
    settings: settingsVi,
    navigation: navigationVi,
    notifications: notificationsVi,
    errors: errorsVi
  }
} as const

export function detectInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem('app_language')
    if (saved === 'en' || saved === 'vi') {
      return saved
    }
  } catch {
    // ignore storage error
  }

  // OS language detection
  const navLang = (typeof navigator !== 'undefined' && (navigator.language || (navigator as any).userLanguage) || '').toLowerCase()
  if (navLang.startsWith('vi')) {
    return 'vi'
  }
  return 'en'
}

const initialLang = detectInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLang,
    fallbackLng: 'en',
    defaultNS,
    ns: ['common', 'tasks', 'projects', 'reminders', 'settings', 'navigation', 'notifications', 'errors'],
    interpolation: {
      escapeValue: false
    }
  })

export async function setApplicationLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    localStorage.setItem('app_language', lang)
  } catch {
    // ignore
  }
  await i18n.changeLanguage(lang)
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: Resources
  }
}

export default i18n

