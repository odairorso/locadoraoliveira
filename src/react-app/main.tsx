import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase } from './supabase.ts'

supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    supabase.auth.signInAnonymously()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
