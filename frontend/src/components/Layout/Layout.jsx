// /frontend/src/components/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../styles/Layout.css'; // Import the CSS

const Layout = () => {
  // State สำหรับการเปิด/ปิด Sidebar, เริ่มต้นให้เปิดบน Desktop และปิดบน Mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Effect สำหรับจัดการการแสดง Sidebar ตามขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(true); // เปิด Sidebar บนจอใหญ่
      } else {
        setIsSidebarOpen(false); // ปิด Sidebar บนจอเล็ก (ให้ผู้ใช้กด toggle เอง)
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // เรียกครั้งแรกเพื่อตั้งค่า
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="page-content">
          <Outlet /> {/* ส่วนนี้จะแสดงเนื้อหาของแต่ละหน้า */}
        </main>
      </div>
    </div>
  );
};

export default Layout;