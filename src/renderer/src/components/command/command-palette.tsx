import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { useUiStore } from '@/stores/ui-store'
import { useTranslation } from 'react-i18next'
import { Plus, Search, CalendarCheck, Inbox, Settings as SettingsIcon, Calendar } from 'lucide-react'

export function CommandPalette() {
  const { t } = useTranslation(['navigation', 'tasks', 'errors'])
  const { commandPaletteOpen, setCommandPaletteOpen, setView, setQuickAddOpen, setSearchOpen } = useUiStore()

  const runCommand = (cmd: () => void) => {
    setCommandPaletteOpen(false)
    cmd()
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder={t('navigation:commandPrompt')} />
      <CommandList>
        <CommandEmpty>{t('errors:noResults')}</CommandEmpty>
        
        <CommandGroup heading={t('navigation:actionsHeading')}>
          <CommandItem onSelect={() => runCommand(() => setQuickAddOpen(true))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>{t('tasks:create')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setSearchOpen(true))}>
            <Search className="mr-2 h-4 w-4" />
            <span>{t('navigation:searchTasks')}</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandGroup heading={t('navigation:navigationHeading')}>
          <CommandItem onSelect={() => runCommand(() => setView('inbox'))}>
            <Inbox className="mr-2 h-4 w-4" />
            <span>{t('navigation:goToInbox')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setView('today'))}>
            <CalendarCheck className="mr-2 h-4 w-4" />
            <span>{t('navigation:goToToday')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setView('upcoming'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>{t('navigation:goToUpcoming')}</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setView('settings'))}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>{t('navigation:goToSettings')}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
