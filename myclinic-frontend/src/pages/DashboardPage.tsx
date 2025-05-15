import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CalendarDays, PieChart as PieChartIcon, BarChart2 as BarChartIcon } from "lucide-react"; // Icons - Aliased here
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mock data for the dashboard
const mockDashboardData = {
  totalPatients: 125,
  appointmentsToday: 15,
  upcomingAppointments: 5,
  patientDistribution: [
    { name: 'เด็ก', value: 40, color: "#38bdf8" }, // sky-500
    { name: 'ผู้ใหญ่', value: 60, color: "#f59e0b" }, // amber-500
    { name: 'ผู้สูงอายุ', value: 25, color: "#8b5cf6" }, // violet-500
  ],
  monthlyAppointments: [
    { month: 'ม.ค.', count: 30 },
    { month: 'ก.พ.', count: 45 },
    { month: 'มี.ค.', count: 60 },
    { month: 'เม.ย.', count: 50 },
  ],
};

const PIE_CHART_COLORS = mockDashboardData.patientDistribution.map(entry => entry.color);

function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card: Total Patients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              จำนวนคนไข้ทั้งหมด
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDashboardData.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              +5% จากเดือนที่แล้ว
            </p>
          </CardContent>
        </Card>

        {/* Stat Card: Appointments Today */}
        <Card >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              นัดหมายวันนี้
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockDashboardData.appointmentsToday}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="destructive" className="mr-1">ด่วน</Badge> {mockDashboardData.upcomingAppointments} รายการรออนุมัติ
            </p>
          </CardContent>
        </Card>

        {/* Placeholder Card: Pie Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สัดส่วนคนไข้</CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockDashboardData.patientDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {mockDashboardData.patientDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Placeholder Card: Bar Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">นัดหมายรายเดือน</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mockDashboardData.monthlyAppointments}>
                <XAxis
                  dataKey="month"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
export default DashboardPage;