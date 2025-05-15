import { useState } from "react";
// import { useNavigate } from "react-router-dom"; // ไม่จำเป็นแล้วถ้า login ใน AuthContext redirect เอง
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"; // เพิ่ม useAuth

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth(); // ดึงฟังก์ชัน login มาจาก AuthContext

  const handleLogin = () => {
    setError(""); // Clear previous errors
    // Mock login logic: username 'admin', password 'password'
    if (username === "admin" && password === "password") {
      login(username); // เรียกฟังก์ชัน login จาก AuthContext
    } else {
      console.log("Login failed");
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader >
          <CardTitle className="text-2xl font-bold text-center">เข้าสู่ระบบ MyClinic</CardTitle>
          <CardDescription className="text-center pt-1">
            กรุณากรอกข้อมูลเพื่อเข้าใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username" className="block mb-1.5">ชื่อผู้ใช้</Label> {/* Added block and mb-1.5 */}
            <Input
              id="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password" className="block mb-1.5">รหัสผ่าน</Label> {/* Added block and mb-1.5 */}
            <Input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center pt-1"> {/* Ensured some top padding for error message */}
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>เข้าสู่ระบบ</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
