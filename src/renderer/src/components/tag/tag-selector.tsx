import React, { useState } from 'react'
import { Check, Plus, Tag as TagIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTagStore } from '@/stores/tag-store'
import { TAG_COLORS } from '@shared/constants'
import { cn } from '@/lib/utils'

type TagSelectorProps = {
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const { t } = useTranslation('navigation')
  const tags = useTagStore(s => s.tags)
  const fetchTags = useTagStore(s => s.fetchTags)
  const [open, setOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter(t => t !== id))
    } else {
      onChange([...selectedTagIds, id])
    }
  }

  const createTag = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagName.trim()) {
      e.preventDefault()
      if (window.api?.tags?.create) {
        const newTag = await window.api.tags.create({ 
          name: newTagName.trim(), 
          color: TAG_COLORS[0] 
        })
        await fetchTags()
        onChange([...selectedTagIds, newTag.id])
        setNewTagName('')
      }
    }
  }

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-auto min-h-8 py-1 px-2 w-full justify-start whitespace-normal text-xs border-border/80">
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(tag => (
                <Badge 
                  key={tag.id} 
                  variant="secondary"
                  className="text-[11px] px-1.5 py-0 font-normal border-transparent"
                  style={{ backgroundColor: `${tag.color || '#3b82f6'}20`, color: tag.color || '#3b82f6' }}
                >
                  #{tag.name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <TagIcon className="h-3.5 w-3.5" /> {t('addTags')}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-2 text-xs" align="start">
        <div className="space-y-2">
          <div className="max-h-[200px] overflow-y-auto space-y-0.5">
            {tags.map(tag => {
              const isSelected = selectedTagIds.includes(tag.id)
              return (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-muted cursor-pointer"
                  onClick={() => toggleTag(tag.id)}
                >
                  <div className={cn("flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-primary", isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                    <Check className="h-2.5 w-2.5" />
                  </div>
                  <div 
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color || '#3b82f6' }}
                  />
                  <span className="text-xs truncate">{tag.name}</span>
                </div>
              )
            })}
          </div>
          
          <div className="flex items-center gap-2 px-2 pt-2 border-t border-border/60 mt-2">
            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input 
              value={newTagName} 
              onChange={e => setNewTagName(e.target.value)} 
              onKeyDown={createTag} 
              placeholder={t('addTag')} 
              className="h-7 text-xs border-none focus-visible:ring-0 px-1 shadow-none" 
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
