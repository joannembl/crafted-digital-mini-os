import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { WorkspaceProvider } from './features/workspace/WorkspaceContext'
import { ProspectsProvider } from './features/prospects/ProspectsContext'
import { Toaster } from 'react-hot-toast'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
        <WorkspaceProvider>
          <ProspectsProvider>
            <>
              <App />
              <Toaster position="top-right" toastOptions={{ duration: 3200 }} />
            </>
          </ProspectsProvider>
        </WorkspaceProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
