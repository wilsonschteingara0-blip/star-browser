import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/base.css'
import './styles/pages.css'
import './styles/chromium.css'
import App from './App'
import { BrowserProvider } from './store/browser'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserProvider>
      <App />
    </BrowserProvider>
  </StrictMode>,
)
