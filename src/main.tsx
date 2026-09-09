import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ProgressProvider } from './lib/ProgressProvider'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Không tìm thấy #root')

createRoot(root).render(
  <StrictMode>
    <ProgressProvider>
      <App />
    </ProgressProvider>
  </StrictMode>,
)
