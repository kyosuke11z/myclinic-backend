import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
// import './index.css'; // Global styles, ตรวจสอบว่า import ที่ main.jsx แล้ว

// Script to handle SPA routing on GitHub Pages after 404 redirect
(function () {
  const redirect = sessionStorage.redirect;
  delete sessionStorage.redirect;
  if (redirect && redirect !== window.location.href) {
    window.history.replaceState(null, null, redirect);
  }
})();
// กำหนด Theme ที่ไม่ซ้ำใคร
const uniqueTheme = createTheme({
  palette: {
    primary: {
      main: '#1abc9c', // Teal - สีหลักสำหรับปุ่ม, icon, etc.
    },
    secondary: {
      main: '#f39c12', // Orange - สีรอง
    },
    error: {
      main: '#e74c3c', // Red - สำหรับ error messages
    },
    background: {
      default: '#f4f7f6', // สีพื้นหลังของ body (ถ้าใช้ CssBaseline)
      paper: '#ffffff', // สีพื้นหลังของการ์ด, Modal
    },
    text: {
      primary: '#34495e', // Dark Blue-Gray - สีข้อความหลัก
      secondary: '#7f8c8d', // Gray - สีข้อความรอง
    }
  },
  typography: {
    fontFamily: '"Kanit", sans-serif', // ลองใช้ Font Kanit (ต้อง import ใน index.html หรือ index.css)
    h4: {
      fontWeight: 700,
    }
  },
  shape: {
    borderRadius: 8, // ปรับความโค้งมนเริ่มต้นของ components
  },
});

function App() {
  return (
    <Router> {/* <Router> needs to be the outermost wrapper */}
      

      <ThemeProvider theme={uniqueTheme}> {/* Wrap with ThemeProvider */}
        <CssBaseline /> {/* Apply CSS resets and theme background */}
        <AuthProvider> {/* AuthProvider is inside ThemeProvider */}
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
