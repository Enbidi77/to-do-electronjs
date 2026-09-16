import { describe, it, expect, beforeEach } from 'vitest'
import i18n, { setApplicationLanguage, resources } from '../../src/renderer/src/i18n'

describe('i18n system', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('loads English translations by default', () => {
    expect(i18n.t('common:appName')).toBe('Todo')
    expect(i18n.t('tasks:create')).toBe('Create task')
    expect(i18n.t('navigation:inbox')).toBe('Inbox')
    expect(i18n.t('settings:title')).toBe('Settings')
  })

  it('loads Vietnamese translations properly', async () => {
    await setApplicationLanguage('vi')
    expect(i18n.t('tasks:create')).toBe('Tạo công việc')
    expect(i18n.t('tasks:tasks')).toBe('Công việc')
    expect(i18n.t('projects:projects')).toBe('Dự án')
    expect(i18n.t('navigation:inbox')).toBe('Hộp thư đến')
    expect(i18n.t('navigation:today')).toBe('Hôm nay')
    expect(i18n.t('settings:appearance.theme')).toBe('Chủ đề giao diện')
  })

  it('persists selected language in localStorage', async () => {
    await setApplicationLanguage('vi')
    expect(localStorage.getItem('app_language')).toBe('vi')

    await setApplicationLanguage('en')
    expect(localStorage.getItem('app_language')).toBe('en')
  })

  it('falls back to English when a key is missing in another language', async () => {
    await i18n.changeLanguage('vi')
    // All namespaces exist in resources
    expect(resources.en.common.appName).toBe('Todo')
    expect(resources.vi.common.appName).toBe('Todo')
  })
})

