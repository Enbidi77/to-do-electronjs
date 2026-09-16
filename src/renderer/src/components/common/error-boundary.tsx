import { Component, ReactNode, ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import { useUiStore } from '@/stores/ui-store'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = (): void => {
    this.setState({ hasError: false, error: null })
    useUiStore.getState().setView('inbox')
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              An unexpected error occurred while rendering this page.
            </p>
            {this.state.error && (
              <p className="text-xs text-destructive/80 font-mono bg-destructive/5 p-2 rounded mt-2 break-all text-left">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </Button>
            <Button size="sm" onClick={this.handleGoHome} className="gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Back to Inbox
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

