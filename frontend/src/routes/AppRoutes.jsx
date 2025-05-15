// /frontend/src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout'; // จะสร้างในขั้นตอนถัดไป
import LoginPage from '../pages/LoginPage'; // จะสร้างในขั้นตอนถัดไป
import DashboardPage from '../pages/DashboardPage'; // จะสร้างในขั้นตอนถัดไป
import AppointmentsPage from '../pages/AppointmentsPage'; // จะสร้างในขั้นตอนถัดไป
import PatientsPage from '../pages/PatientsPage'; // จะสร้างในขั้นตอนถัดไป
import NotFoundPage from '../pages/NotFoundPage'; // จะสร้างในขั้นตอนถัดไป
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}> {/* Routes ที่ต้อง Login */}
        <Route element={<Layout />}> {/* ใช้ Layout ร่วมกัน */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} /> {/* หน้า 404 */}
    </Routes>
  );
};

export default AppRoutes;