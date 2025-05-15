import { Routes, Route, Navigate } from "react-router-dom"; // เอา BrowserRouter ออก
import Layout from "@/components/Layout";
import DashboardPage from "@/pages/DashboardPage";
import PatientsPage from "@/pages/PatientsPage";
import AppointmentsPage from "@/pages/AppointmentsPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/login";
import ProtectedRoute from "./components/ProtectedRoute";
import { SidebarProvider } from "@/components/ui/sidebar"; // 1. Import SidebarProvider

function App() {
  // const { isAuthenticated } = useAuth(); // ไม่จำเป็นต้องใช้ที่นี่แล้ว เพราะ ProtectedRoute จัดการ

  return (
    // <BrowserRouter>  <-- เอาออก
    <Routes>
      {/* Routes ที่ไม่ต้อง Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes (ต้อง Login ก่อน) */}
      <Route element={<ProtectedRoute />}> {/* ใช้ ProtectedRoute ครอบ Layout และหน้าอื่นๆ */}
        {/* 2. ครอบ Layout ด้วย SidebarProvider */}
        <Route path="/" element={
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        }> {/* Layout จะแสดงเฉพาะเมื่อ Login แล้ว */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
    // </BrowserRouter> <-- เอาออก
  );
}

export default App;
