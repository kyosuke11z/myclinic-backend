import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface Settings {
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_email?: string;
  // Add other settings as needed
}

const API_BASE_URL = "http://localhost:5000";

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
        }
        const data: Settings = await response.json();
        setSettings(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Unknown error";
        toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถโหลดการตั้งค่าได้: ${errorMessage}`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({ title: "บันทึกสำเร็จ", description: "การตั้งค่าได้รับการอัปเดตแล้ว" });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถบันทึกการตั้งค่าได้: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ตั้งค่าระบบ</h1>

      {isLoading ? (
        <p>กำลังโหลดการตั้งค่า...</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลคลินิก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label htmlFor="clinic_name">ชื่อคลินิก</Label><Input id="clinic_name" name="clinic_name" value={settings.clinic_name || ""} onChange={handleInputChange} /></div>
              <div><Label htmlFor="clinic_phone">เบอร์โทรศัพท์คลินิก</Label><Input id="clinic_phone" name="clinic_phone" value={settings.clinic_phone || ""} onChange={handleInputChange} /></div>
              <div><Label htmlFor="clinic_email">อีเมลคลินิก</Label><Input id="clinic_email" name="clinic_email" type="email" value={settings.clinic_email || ""} onChange={handleInputChange} /></div>
              <div><Label htmlFor="clinic_address">ที่อยู่คลินิก</Label><Input id="clinic_address" name="clinic_address" value={settings.clinic_address || ""} onChange={handleInputChange} /></div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
export default SettingsPage;