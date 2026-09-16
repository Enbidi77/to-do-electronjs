import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSettingsStore } from '@/stores/settings-store'
import { useProjectStore } from '@/stores/project-store'
import { useTheme } from '@/components/theme-provider'
import type { AppInfo } from '@shared/types'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Database, Globe } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation(['settings', 'common', 'notifications', 'errors', 'reminders', 'navigation'])
  const { settings, updateSetting } = useSettingsStore()
  const projects = useProjectStore(s => s.projects)
  const { theme, setTheme } = useTheme()
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    if (window.api?.app?.getInfo) {
      window.api.app.getInfo().then(setAppInfo).catch(console.error)
    }
  }, [])

  const handleExportJSON = async () => {
    try {
      if (window.api?.app?.exportData) {
        const filePath = await window.api.app.exportData({
          format: 'json',
          includeCompleted: true,
          includeArchived: true
        })
        toast.success(t('notifications:exportedData', { path: filePath }))
      }
    } catch {
      toast.error(t('errors:exportFailed'))
    }
  }

  const handleExportCSV = async () => {
    try {
      if (window.api?.app?.exportData) {
        const filePath = await window.api.app.exportData({
          format: 'csv',
          includeCompleted: true,
          includeArchived: true
        })
        toast.success(t('notifications:exportedCSV', { path: filePath }))
      }
    } catch {
      toast.error(t('errors:exportFailed'))
    }
  }

  const handleBackup = async () => {
    try {
      if (window.api?.app?.backupDatabase) {
        const backup = await window.api.app.backupDatabase()
        toast.success(t('notifications:backupCreated', { filename: backup.filename }))
      }
    } catch {
      toast.error(t('errors:backupFailed'))
    }
  }

  const handleReset = async () => {
    if (window.confirm(t('common:dialogs.confirmResetSettings'))) {
      try {
        if (window.api?.settings?.reset) {
          await window.api.settings.reset()
          await useSettingsStore.getState().fetchSettings()
          toast.success(t('notifications:settingsReset'))
        }
      } catch {
        toast.error(t('errors:resetSettingsFailed'))
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('settings:subtitle')}</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 grid grid-cols-5 w-full">
            <TabsTrigger value="general">{t('settings:tabs.general')}</TabsTrigger>
            <TabsTrigger value="appearance">{t('settings:tabs.appearance')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings:tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="data">{t('settings:tabs.data')}</TabsTrigger>
            <TabsTrigger value="about">{t('settings:tabs.about')}</TabsTrigger>
          </TabsList>

          {/* GENERAL */}
          <TabsContent value="general" className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">{t('settings:language.selectLanguage')}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{t('settings:language.selectLanguageDesc')}</p>
              </div>
              <Select
                value={settings.language || 'en'}
                onValueChange={(val: 'en' | 'vi') => updateSetting('language', val)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('settings:language.en')}</SelectItem>
                  <SelectItem value="vi">{t('settings:language.vi')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:general.startWithWindows')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:general.startWithWindowsDesc')}</p>
              </div>
              <Switch
                checked={settings.startWithWindows}
                onCheckedChange={(checked) => updateSetting('startWithWindows', checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:general.closeToTray')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:general.closeToTrayDesc')}</p>
              </div>
              <Switch
                checked={settings.closeToTray}
                onCheckedChange={(checked) => updateSetting('closeToTray', checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:general.confirmBeforeDelete')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:general.confirmBeforeDeleteDesc')}</p>
              </div>
              <Switch
                checked={settings.confirmBeforeDelete}
                onCheckedChange={(checked) => updateSetting('confirmBeforeDelete', checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:general.defaultProject')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:general.defaultProjectDesc')}</p>
              </div>
              <Select
                value={settings.defaultProjectId || 'inbox'}
                onValueChange={(val) => updateSetting('defaultProjectId', val === 'inbox' ? null : val)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder={t('navigation:inbox')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inbox">{t('navigation:inbox')}</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* APPEARANCE */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:appearance.theme')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:appearance.themeDesc')}</p>
              </div>
              <Select value={theme} onValueChange={(val: 'light' | 'dark' | 'system') => setTheme(val)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings:appearance.themeLight')}</SelectItem>
                  <SelectItem value="dark">{t('settings:appearance.themeDark')}</SelectItem>
                  <SelectItem value="system">{t('settings:appearance.themeSystem')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:appearance.compactMode')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:appearance.compactModeDesc')}</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => updateSetting('compactMode', checked)}
              />
            </div>
          </TabsContent>

          {/* NOTIFICATIONS */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:notifications.enableNotifications')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:notifications.enableNotificationsDesc')}</p>
              </div>
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:notifications.sound')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:notifications.soundDesc')}</p>
              </div>
              <Switch
                checked={settings.notificationSound}
                onCheckedChange={(checked) => updateSetting('notificationSound', checked)}
              />
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:notifications.defaultSnooze')}</h3>
                <p className="text-xs text-muted-foreground">{t('settings:notifications.defaultSnoozeDesc')}</p>
              </div>
              <Select
                value={settings.defaultSnoozeDuration}
                onValueChange={(val) => updateSetting('defaultSnoozeDuration', val)}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">{t('reminders:snoozeDurations.5m')}</SelectItem>
                  <SelectItem value="10m">{t('reminders:snoozeDurations.10m')}</SelectItem>
                  <SelectItem value="15m">{t('reminders:snoozeDurations.15m')}</SelectItem>
                  <SelectItem value="30m">{t('reminders:snoozeDurations.30m')}</SelectItem>
                  <SelectItem value="1h">{t('reminders:snoozeDurations.1h')}</SelectItem>
                  <SelectItem value="1d">{t('reminders:snoozeDurations.1d')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:notifications.overdueReminders')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings:notifications.overdueRemindersDesc')}
                </p>
              </div>
              <Switch
                checked={settings.showOverdueReminders}
                onCheckedChange={(checked) => updateSetting('showOverdueReminders', checked)}
              />
            </div>
          </TabsContent>

          {/* DATA & BACKUP */}
          <TabsContent value="data" className="space-y-6">
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-medium text-sm">{t('settings:data.exportTitle')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('settings:data.exportDesc')}
              </p>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportJSON}>
                  <Download className="h-3.5 w-3.5" /> {t('settings:data.exportJSON')}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
                  <Download className="h-3.5 w-3.5" /> {t('settings:data.exportCSV')}
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-b pb-4">
              <h3 className="font-medium text-sm">{t('settings:data.backupTitle')}</h3>
              <div className="text-xs text-muted-foreground bg-muted p-2.5 rounded font-mono break-all">
                {appInfo?.databasePath || 'Local SQLite database'}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={handleBackup}>
                  <Database className="h-3.5 w-3.5" /> {t('settings:data.backupNow')}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h3 className="font-medium text-sm text-destructive">{t('settings:data.resetTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('settings:data.resetDesc')}</p>
              <Button variant="destructive" size="sm" className="mt-2" onClick={handleReset}>
                {t('settings:data.resetSettings')}
              </Button>
            </div>
          </TabsContent>

          {/* ABOUT */}
          <TabsContent value="about" className="space-y-4">
            <div className="rounded-xl border p-5 bg-card text-card-foreground space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  ✓
                </div>
                <div>
                  <h2 className="text-base font-bold">Todo Desktop</h2>
                  <p className="text-xs text-muted-foreground">Professional commercial task manager for Windows</p>
                </div>
              </div>

              <div className="divide-y text-xs pt-2">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.version')}</span>
                  <span className="font-medium">{appInfo?.version || '1.0.0'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.electronVersion')}</span>
                  <span className="font-medium">{appInfo?.electronVersion || '32.3.3'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.nodeVersion')}</span>
                  <span className="font-medium">{appInfo?.nodeVersion || '20.18.1'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.chromeVersion')}</span>
                  <span className="font-medium">{appInfo?.chromeVersion || '128.0'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.platform')}</span>
                  <span className="font-medium">{appInfo?.platform || 'win32'}</span>
                </div>
                {appInfo?.databasePath && (
                  <div className="py-2 flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{t('settings:about.databasePath')}</span>
                    <span className="font-mono text-[11px] truncate">{appInfo.databasePath}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
