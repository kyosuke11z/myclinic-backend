// /frontend/src/components/Layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../../styles/Layout.css'; // Import the CSS

const Sidebar = ({ isOpen }) => {
  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>✨ รพ. สุขใจ</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><NavLink to="/" end>📊 Dashboard</NavLink></li>
          <li><NavLink to="/appointments">📅 นัดหมาย</NavLink></li>
          <li><NavLink to="/patients">🧑‍🦰 ผู้ป่วย</NavLink></li>
          {/* เพิ่มลิงก์อื่นๆ ที่นี่ถ้าต้องการ */}
        </ul>
      </nav>
      {/* สามารถเพิ่มส่วน footer ของ sidebar ได้ที่นี่ */}
    </aside>
  );
};

export default Sidebar;