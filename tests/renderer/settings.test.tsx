import { render, screen, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SettingsPage from '@/pages/settings'
import { ThemeProvider } from '@/components/theme-provider'

describe('SettingsPage', () => {
  it('renders settings tabs and options without errors', async () => {
    await act(async () => {
      render(
        <ThemeProvider>
          <SettingsPage />
        </ThemeProvider>
      )
    })

    // Heading
    expect(screen.getByText('Settings')).toBeDefined()
    expect(screen.getByText('Manage your application preferences and data')).toBeDefined()

    // Tabs
    expect(screen.getByRole('tab', { name: 'General' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Notifications' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Appearance' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'Data & Backup' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'About' })).toBeDefined()

    // General tab content
    expect(screen.getByText('Start with Windows')).toBeDefined()
    expect(screen.getByText('Close to tray')).toBeDefined()
    expect(screen.getByText('Confirm before deleting')).toBeDefined()
    expect(screen.getByText('Default Project')).toBeDefined()
  })
})

