import { Link, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";

function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-6">
        <div className="text-2xl font-bold">MyClinic</div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="block px-4 py-2 rounded hover:bg-gray-700"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/patients"
                className="block px-4 py-2 rounded hover:bg-gray-700"
              >
                จัดการคนไข้ (Patients)
              </Link>
            </li>
            <li>
              <Link
                to="/appointments"
                className="block px-4 py-2 rounded hover:bg-gray-700"
              >
                การนัดหมาย (Appointments)
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className="block px-4 py-2 rounded hover:bg-gray-700"
              >
                ตั้งค่า (Settings)
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white shadow p-4">
          <h1 className="text-xl font-semibold">ระบบคลินิก MyClinic</h1>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <Outlet /> {/* Page content will be rendered here */}
          <Toaster /> {/* Toaster for shadcn/ui toast notifications */}
        </div>
      </main>
    </div>
  );
}

export default Layout;
