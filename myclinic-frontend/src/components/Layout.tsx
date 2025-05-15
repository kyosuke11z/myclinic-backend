import { Link, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import { useSidebar } from "@/components/ui/sidebar"; // Import useSidebar
import { Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from "@/components/ui/sidebar"; // Import SidebarInset
import { LayoutDashboard, Users, CalendarDays, Settings as SettingsIcon } from "lucide-react"; // Import icons
import { useLocation } from "react-router-dom"; // Import useLocation

function Layout() {
  // คุณอาจจะต้องใช้ state บางตัวจาก useSidebar() ถ้าต้องการ custom logic เพิ่มเติม
  // แต่โดยทั่วไป SidebarTrigger และ Sidebar component ควรจะทำงานร่วมกันผ่าน context ได้
  const location = useLocation(); // Get current location for active menu item

  return (
    // SidebarProvider ควรจะจัดการ --sidebar-width และ --sidebar-width-icon ผ่าน style prop ของมัน
    // div ครอบนอกสุดควรจะใช้ flex เพื่อให้ Sidebar และ main content อยู่ข้างกัน
    <div className="flex h-screen bg-background text-foreground"> {/* Use theme-aware background/text */}
      <Sidebar
        collapsible="icon" // ลอง "offcanvas" หรือ "none" ด้วย
        variant="sidebar"    // ลอง "floating" หรือ "inset" ด้วย
        // defaultOpen={true} // คุณสามารถลองตั้งค่านี้เพื่อดูว่า sidebar เริ่มต้นแบบขยายหรือไม่
      >
        <SidebarHeader className="p-4 border-b border-border"> {/* Use theme-aware border */}
          <div className="text-2xl font-bold text-white">MyClinic</div>
        </SidebarHeader>
        <SidebarContent className="p-2"> {/* Adjusted padding for content */}
        <nav>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Dashboard"
                isActive={location.pathname === '/dashboard' || location.pathname === '/'}
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="จัดการคนไข้" isActive={location.pathname.startsWith('/patients')}>
                <Link to="/patients">
                  <Users className="size-4" />
                  <span>จัดการคนไข้</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="การนัดหมาย" isActive={location.pathname.startsWith('/appointments')}>
                <Link to="/appointments">
                  <CalendarDays className="size-4" />
                  <span>การนัดหมาย</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="ตั้งค่า" isActive={location.pathname.startsWith('/settings')}>
                <Link to="/settings">
                  <SettingsIcon className="size-4" />
                  <span>ตั้งค่า</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </nav>
        </SidebarContent>
        {/* <SidebarFooter> ... </SidebarFooter> */}
      </Sidebar>

      {/* Use SidebarInset to wrap the main content if you are using "inset" variant for Sidebar */}
      {/* For "sidebar" or "floating" variant, a simple main tag is often enough */}
      {/* <SidebarInset> */}
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/30"> {/* Added bg-muted/30 for main content area */}
        <header className="bg-card text-card-foreground shadow p-4 border-b border-border"> {/* Use theme-aware colors and border */}
          <div className="flex justify-between items-center">
            <SidebarTrigger /> {/* This trigger will work for both mobile (off-canvas) and desktop (collapsible icon) */}
            <h1 className="text-xl font-semibold ml-2 md:ml-0">ระบบคลินิก MyClinic</h1>
            <Button variant="outline" onClick={useAuth().logout}>
              ออกจากระบบ
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet /> {/* Page content will be rendered here */}
          <Toaster /> {/* Toaster for shadcn/ui toast notifications */}
        </div>
      </main>
      {/* </SidebarInset> */}
    </div>
  );
}

export default Layout;