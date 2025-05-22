// /frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css' // ตรวจสอบว่า global styles ถูก import ที่นี่หรือใน App.jsx

// Script to handle SPA routing on GitHub Pages after 404 redirect
// This script should run before the React app is rendered.
// It checks if sessionStorage contains a redirect path (set by 404.html)
// and updates the browser history accordingly.
(function () {
  const redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== window.location.href) {
    // Replace the current history state with the intended URL.
    window.history.replaceState(null, null, redirect);
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/myclinic-backend/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
