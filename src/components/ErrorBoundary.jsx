import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Keep this console-only so sensitive details are not rendered to normal users.
    console.error('Crafted Digital Mini OS error boundary caught an error:', error, info)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary-screen">
        <div className="error-boundary-card">
          <div className="error-boundary-icon"><AlertTriangle size={28} /></div>
          <p className="eyebrow">Something went wrong</p>
          <h1>Mini OS hit an unexpected error.</h1>
          <p>
            Your data is still stored in Supabase. Try refreshing the app. If this keeps happening,
            check the browser console and the latest Supabase logs.
          </p>
          <button className="primary-button" type="button" onClick={this.handleReload}>
            <RefreshCw size={16} /> Reload app
          </button>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="error-boundary-details">{this.state.error.message}</pre>
          )}
        </div>
      </div>
    )
  }
}
