// /frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // ตรวจสอบว่า global styles ถูก import ที่นี่หรือใน App.jsx
// อ่าน redirect path จาก URL
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('redirect');

if (redirectPath) {
  window.history.replaceState({}, '', redirectPath);
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
