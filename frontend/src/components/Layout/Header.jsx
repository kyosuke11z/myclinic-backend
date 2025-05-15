// /frontend/src/components/Layout/Header.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/Layout.css'; // Import the CSS

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { logout, user } = useAuth();

  return (
    <header className="app-header">
      <button onClick={toggleSidebar} className="sidebar-toggle-btn">
        {/* ใช้ icon หรือ text ก็ได้ */}
        {isSidebarOpen ? '✕' : '☰'}
      </button>
      <div className="header-title">
        {/* สามารถแสดงชื่อหน้าปัจจุบันได้ถ้าต้องการ */}
        ระบบจัดการโรงพยาบาล
      </div>
      <div className="user-actions">
        {user && <span className="username-display">สวัสดี, {user.username}</span>}
        <button onClick={logout} className="logout-btn">ออกจากระบบ</button>
      </div>
    </header>
  );
};

export default Header;