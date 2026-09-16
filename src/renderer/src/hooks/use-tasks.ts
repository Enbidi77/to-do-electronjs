import { useEffect } from 'react'
import { useUiStore } from '../stores/ui-store'
import { useTaskStore } from '../stores/task-store'

export function useTasks() {
  const { currentView, currentProjectId, currentTagId } = useUiStore()
  const { tasks, loading, error, fetchTasks } = useTaskStore()

  useEffect(() => {
    const options: Record<string, any> = {}
    
    switch (currentView) {
      case 'inbox':
        options.projectId = null
        options.status = 'active'
        break
      case 'today':
        options.dueDate = 'today'
        options.status = 'active'
        options.includeOverdue = true
        break
      case 'upcoming':
        options.status = 'active'
        options.sortBy = 'dueDate'
        break
      case 'completed':
        options.status = 'completed'
        break
      case 'project':
        if (currentProjectId) {
          options.projectId = currentProjectId
        }
        break
      case 'tag':
        if (currentTagId) {
          options.tagId = currentTagId
        }
        break
      case 'settings':
        // Do not fetch tasks for settings view
        return
    }

    fetchTasks(options)
  }, [currentView, currentProjectId, currentTagId, fetchTasks])

  return {
    tasks,
    loading,
    error,
    refetch: () => fetchTasks() // uses previous state usually, or will trigger new fetch based on current UI store state if called from component
  }
}
