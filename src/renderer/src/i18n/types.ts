import type commonEn from './locales/en/common.json'
import type tasksEn from './locales/en/tasks.json'
import type projectsEn from './locales/en/projects.json'
import type remindersEn from './locales/en/reminders.json'
import type settingsEn from './locales/en/settings.json'
import type navigationEn from './locales/en/navigation.json'
import type notificationsEn from './locales/en/notifications.json'
import type errorsEn from './locales/en/errors.json'

export interface Resources {
  common: typeof commonEn
  tasks: typeof tasksEn
  projects: typeof projectsEn
  reminders: typeof remindersEn
  settings: typeof settingsEn
  navigation: typeof navigationEn
  notifications: typeof notificationsEn
  errors: typeof errorsEn
}

export type SupportedLanguage = 'en' | 'vi'

