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
import { Download, Database, Globe, Bell, Keyboard } from 'lucide-react'
import { KEYBOARD_SHORTCUTS } from '@shared/constants'

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

  const [isSendingNotification, setIsSendingNotification] = useState(false)

  const handleSendTestNotification = async () => {
    try {
      setIsSendingNotification(true)
      if (window.api?.app?.showNotification) {
        await window.api.app.showNotification({
          title: t('settings:notifications.testTitle') || 'Todo Notification',
          body: t('settings:notifications.testBody') || 'Windows notifications are working correctly!'
        })
        toast.success(t('settings:notifications.testSent') || 'Test notification sent')
      } else {
        toast.error('Notification API is not available')
      }
    } catch (error) {
      console.error('Failed to send test notification:', error)
      toast.error(t('settings:notifications.testFailed') || 'Failed to send test notification')
    } finally {
      setIsSendingNotification(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{t('settings:title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t('settings:subtitle')}</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="mb-6 grid grid-cols-6 w-full h-8 p-0.5 bg-muted/40 border border-border/50">
            <TabsTrigger value="general" className="text-xs">{t('settings:tabs.general')}</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">{t('settings:tabs.notifications')}</TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs">{t('settings:tabs.appearance')}</TabsTrigger>
            <TabsTrigger value="keyboard" className="text-xs">{t('common:shortcuts.title', { defaultValue: 'Keyboard' })}</TabsTrigger>
            <TabsTrigger value="data" className="text-xs">{t('settings:tabs.data')}</TabsTrigger>
            <TabsTrigger value="about" className="text-xs">{t('settings:tabs.about')}</TabsTrigger>
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

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <h3 className="font-medium text-sm">{t('settings:notifications.testNotification')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('settings:notifications.testNotificationDesc')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendTestNotification}
                disabled={isSendingNotification}
              >
                <Bell className="w-4 h-4 mr-2" />
                {t('settings:notifications.sendTest')}
              </Button>
            </div>
          </TabsContent>

          {/* KEYBOARD SHORTCUTS */}
          <TabsContent value="keyboard" className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-foreground">{t('common:shortcuts.title', { defaultValue: 'Keyboard Shortcuts' })}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{t('common:shortcuts.description', { defaultValue: 'Global and application navigation shortcuts' })}</p>
            </div>

            <div className="divide-y divide-border/60 border border-border/60 rounded-lg overflow-hidden bg-card text-xs">
              {Object.entries(KEYBOARD_SHORTCUTS).map(([actionKey, sc]) => {
                const keys: string[] = []
                if ('ctrlKey' in sc && sc.ctrlKey) keys.push('Ctrl')
                if ('shiftKey' in sc && sc.shiftKey) keys.push('Shift')
                if ('altKey' in sc && (sc as { altKey?: boolean }).altKey) keys.push('Alt')
                keys.push(sc.key === ' ' ? 'Space' : sc.key.toUpperCase())

                return (
                  <div key={actionKey} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <span className="text-foreground font-normal">{sc.label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k, i) => (
                        <kbd key={i} className="px-1.5 py-0.5 rounded border border-border/70 bg-muted/60 font-mono text-[10px] text-muted-foreground font-medium">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* DATA & BACKUP */}
          <TabsContent value="data" className="space-y-6">
            <div className="space-y-3 border-b border-border/60 pb-4">
              <h3 className="font-medium text-sm text-foreground">{t('settings:data.exportTitle')}</h3>
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

            <div className="space-y-3 border-b border-border/60 pb-4">
              <h3 className="font-medium text-sm text-foreground">{t('settings:data.backupTitle')}</h3>
              <div className="text-xs text-muted-foreground bg-muted/40 border border-border/50 p-2.5 rounded-md font-mono break-all">
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
            <div className="rounded-lg border border-border/60 p-5 bg-card text-card-foreground space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-primary font-bold text-base">
                  ✓
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Todo Desktop</h2>
                  <p className="text-xs text-muted-foreground">Productivity task manager for Windows</p>
                </div>
              </div>

              <div className="divide-y divide-border/50 text-xs pt-1">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.version')}</span>
                  <span className="font-medium text-foreground">{appInfo?.version || '1.0.0'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.electronVersion')}</span>
                  <span className="font-medium text-foreground">{appInfo?.electronVersion || '32.3.3'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.nodeVersion')}</span>
                  <span className="font-medium text-foreground">{appInfo?.nodeVersion || '20.18.1'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.chromeVersion')}</span>
                  <span className="font-medium text-foreground">{appInfo?.chromeVersion || '128.0'}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">{t('settings:about.platform')}</span>
                  <span className="font-medium text-foreground">{appInfo?.platform || 'win32'}</span>
                </div>
                {appInfo?.databasePath && (
                  <div className="py-2 flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{t('settings:about.databasePath')}</span>
                    <span className="font-mono text-[11px] text-muted-foreground truncate">{appInfo.databasePath}</span>
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
