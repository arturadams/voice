import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createClipStore } from './services/clip-store-factory'
import { initServiceWorker } from './services/service-worker'
import { HttpUploader } from './services/http-uploader'
import { ServicesProvider } from './context/services'
import { ThemeProvider } from './context/theme'

initServiceWorker()

const storage = createClipStore()
const uploader = new HttpUploader()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ServicesProvider storage={storage} uploader={uploader}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ServicesProvider>
  </React.StrictMode>,
)

