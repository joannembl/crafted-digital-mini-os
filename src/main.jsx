import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import { AuthProvider } from './features/auth/AuthContext'
import { WorkspaceProvider } from './features/workspace/WorkspaceContext'
import { ProspectsProvider } from './features/prospects/ProspectsContext'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <ProspectsProvider>
            <App />
          </ProspectsProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
)
