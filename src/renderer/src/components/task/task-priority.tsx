import type { TaskPriority } from '@shared/types'
import { PRIORITY_CONFIG } from '@shared/constants'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'

type TaskPrioritySelectorProps = {
  value: TaskPriority
  onChange: (value: TaskPriority) => void
}

const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high', 'urgent']

export function TaskPrioritySelector({ value, onChange }: TaskPrioritySelectorProps) {
  const { t } = useTranslation('tasks')

  return (
    <Select value={value} onValueChange={(val) => onChange(val as TaskPriority)}>
      <SelectTrigger className="w-[150px] h-7 text-xs border-border/80 bg-background">
        <SelectValue placeholder={t('priority')} />
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES.map((p) => {
          const config = PRIORITY_CONFIG[p]
          const label = t(`priorities.${p}`, { defaultValue: config.label })
          return (
            <SelectItem key={p} value={p} className="text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                <span>{label}</span>
                {config.icon && <span className="text-xs text-muted-foreground ml-auto">{config.icon}</span>}
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
