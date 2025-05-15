// /frontend/src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - ไม่พบหน้า</h1>
      <p>ขออภัย, ไม่พบหน้าที่คุณกำลังค้นหา</p>
      <Link to="/">กลับไปหน้าหลัก</Link>
    </div>
  );
};

export default NotFoundPage;