'use client'

import { Component } from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="card max-w-md p-8 text-center">
              <div className="icon-tile mx-auto mb-4 h-12 w-12">!</div>
              <h3 className="mb-2 text-lg font-semibold text-slate-950">
                Something went wrong
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-primary text-sm"
              >
                Try again
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
