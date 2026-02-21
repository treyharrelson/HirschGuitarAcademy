//import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './lms.css'
import LMS_App from './LMS_App.jsx'
import { AppContextProvider } from './context/AppContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('lms')).render(
  <BrowserRouter>
    <AppContextProvider>
      <LMS_App />
    </AppContextProvider>
  </BrowserRouter>,
)
