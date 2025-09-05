import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { IndexedDbStorage } from './services/indexed-db'
import { HttpUploader } from './services/http-uploader'

registerSW({ immediate: true })

const storage = new IndexedDbStorage()
const uploader = new HttpUploader()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App storage={storage} uploader={uploader} />
  </React.StrictMode>,
)

