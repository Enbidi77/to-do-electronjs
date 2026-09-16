import { Suspense, lazy } from 'react'
import { useUiStore } from '@/stores/ui-store'
import { ErrorBoundary } from '@/components/common/error-boundary'

const InboxPage = lazy(() => import('@/pages/inbox'))
const TodayPage = lazy(() => import('@/pages/today'))
const UpcomingPage = lazy(() => import('@/pages/upcoming'))
const CompletedPage = lazy(() => import('@/pages/completed'))
const ProjectViewPage = lazy(() => import('@/pages/project-view'))
const TagViewPage = lazy(() => import('@/pages/tag-view'))
const SettingsPage = lazy(() => import('@/pages/settings'))
const CalendarViewPage = lazy(() => import('@/components/calendar/calendar-view'))

export function ContentArea() {
  const currentView = useUiStore(s => s.currentView)

  const renderContent = () => {
    switch (currentView) {
      case 'inbox': return <InboxPage />
      case 'today': return <TodayPage />
      case 'upcoming': return <UpcomingPage />
      case 'completed': return <CompletedPage />
      case 'project': return <ProjectViewPage />
      case 'tag': return <TagViewPage />
      case 'settings': return <SettingsPage />
      case 'calendar': return <CalendarViewPage />
      default: return <InboxPage />
    }
  }

  return (
    <ErrorBoundary key={currentView}>
      <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>}>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  )
}
