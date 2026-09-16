import { useState } from 'react'
import type { Project } from '@shared/types'
import { Edit, Trash2 } from 'lucide-react'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useUiStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { ProjectDialog } from './project-dialog'
import { toast } from 'sonner'

type ProjectSidebarProps = {
  projects: Project[]
}

export function ProjectSidebar({ projects }: ProjectSidebarProps) {
  const setView = useUiStore(s => s.setView)
  const deleteProject = useProjectStore(s => s.deleteProject)
  
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this project?')) {
      try {
        await deleteProject(id)
        toast.success('Project deleted')
      } catch {
        toast.error('Failed to delete project')
      }
    }
  }

  return (
    <>
      <div className="space-y-1">
        {projects.map(project => (
          <ContextMenu key={project.id}>
            <ContextMenuTrigger>
              <button
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                onClick={() => setView('project', project.id)}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || '#3b82f6' }}
                  />
                  <span className="truncate">{project.name}</span>
                </div>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleEdit(project)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleDelete(project.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
      
      <ProjectDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        project={editingProject} 
      />
    </>
  )
}
