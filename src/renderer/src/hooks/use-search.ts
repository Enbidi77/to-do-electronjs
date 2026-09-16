import { useState, useEffect } from 'react'
import type { Task } from '@shared/types'
import { useTaskStore } from '../stores/task-store'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const { searchTasks } = useTaskStore()

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await searchTasks(query)
        setResults(res)
      } catch (err) {
        console.error('Search failed:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [query, searchTasks])

  return {
    query,
    results,
    loading,
    setQuery
  }
}
