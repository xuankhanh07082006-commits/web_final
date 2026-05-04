import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { PreferenceProvider } from './contexts/PreferenceContext.jsx' 
import { registerSW } from 'virtual:pwa-register'

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, please reload.');
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreferenceProvider>
      <App />
    </PreferenceProvider>
  </React.StrictMode>,
)