import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react"; // Added Edit and Trash2 icons
import { useToast } from "@/components/ui/use-toast";

// Interface for Appointment data
interface Appointment {
  id: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Pending';
  patientId?: string | null;
}

// Type for appointment form data (used for both Add and Edit)
interface AppointmentFormData {
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  patientId?: string;
  // You might want to add 'status' here if it's editable in the form
}

const API_BASE_URL = "http://localhost:5000"; // Your backend URL

function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add Appointment Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAppointmentForm, setNewAppointmentForm] = useState<AppointmentFormData>({
    patientName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    patientId: "",
  });

  // Edit Appointment Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [currentEditForm, setCurrentEditForm] = useState<AppointmentFormData>({
    patientName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    patientId: "",
  });

  // Delete Confirmation Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);


  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      const dataFromBackend: any[] = await response.json();
      const transformedAppointments: Appointment[] = dataFromBackend.map(app => ({
        id: String(app.id),
        patientName: app.patient_name,
        appointmentDate: app.appointment_date,
        appointmentTime: app.appointment_time ? app.appointment_time.substring(0, 5) : "", // Handle null time
        reason: app.reason || "",
        status: app.status,
        patientId: app.patient_id ? String(app.patient_id) : null,
      }));
      setAppointments(transformedAppointments);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Unknown error";
      setError(errorMessage);
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถดึงข้อมูลนัดหมายได้: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, formType: 'add' | 'edit') => {
    const { name, value } = e.target;
    if (formType === 'add') {
      setNewAppointmentForm(prev => ({ ...prev, [name]: value }));
    } else {
      setCurrentEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAppointment = async () => {
    if (!newAppointmentForm.patientName || !newAppointmentForm.appointmentDate || !newAppointmentForm.appointmentTime) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกชื่อคนไข้, วันที่ และเวลานัดหมาย", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        patient_name: newAppointmentForm.patientName,
        appointment_date: newAppointmentForm.appointmentDate,
        appointment_time: newAppointmentForm.appointmentTime,
        reason: newAppointmentForm.reason,
        status: 'Pending', // Default status
        patient_id: newAppointmentForm.patientId || null,
      };
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({ title: "เพิ่มนัดหมายสำเร็จ", description: `นัดหมายสำหรับ ${newAppointmentForm.patientName} ถูกเพิ่มแล้ว` });
      setIsAddDialogOpen(false);
      setNewAppointmentForm({ patientName: "", appointmentDate: "", appointmentTime: "", reason: "", patientId: "" });
      fetchAppointments();
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการเพิ่มนัดหมาย", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setCurrentEditForm({
      patientName: appointment.patientName,
      appointmentDate: appointment.appointmentDate, // Should be YYYY-MM-DD
      appointmentTime: appointment.appointmentTime, // Should be HH:MM
      reason: appointment.reason,
      patientId: appointment.patientId || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !currentEditForm.patientName || !currentEditForm.appointmentDate || !currentEditForm.appointmentTime) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกชื่อคนไข้, วันที่ และเวลานัดหมาย", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        patient_name: currentEditForm.patientName,
        appointment_date: currentEditForm.appointmentDate,
        appointment_time: currentEditForm.appointmentTime,
        reason: currentEditForm.reason,
        // status: currentEditForm.status, // If status is editable
        patient_id: currentEditForm.patientId || null,
      };
      const response = await fetch(`${API_BASE_URL}/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({ title: "แก้ไขนัดหมายสำเร็จ", description: `นัดหมายสำหรับ ${currentEditForm.patientName} ได้รับการอัปเดตแล้ว` });
      setIsEditDialogOpen(false);
      setEditingAppointment(null);
      fetchAppointments();
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการแก้ไขนัดหมาย", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirmDialog = (appointment: Appointment) => {
    setDeletingAppointment(appointment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteAppointment = async () => {
    if (!deletingAppointment) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${deletingAppointment.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({ title: "ลบนัดหมายสำเร็จ", description: `นัดหมายสำหรับ ${deletingAppointment.patientName} ถูกลบแล้ว`, variant: "destructive" });
      fetchAppointments();
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการลบนัดหมาย", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
      setIsDeleteDialogOpen(false); // Close dialog after operation
      setDeletingAppointment(null);
    }
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">การนัดหมาย (Appointments)</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            if (isSaving) return;
            setIsAddDialogOpen(open);
            if (!open) setNewAppointmentForm({ patientName: "", appointmentDate: "", appointmentTime: "", reason: "", patientId: "" });
        }}>
          <DialogTrigger asChild>
            <Button disabled={isSaving}><PlusCircle className="mr-2 h-4 w-4" /> เพิ่มนัดหมายใหม่</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>เพิ่มนัดหมายใหม่</DialogTitle>
              <DialogDescription>กรอกรายละเอียดการนัดหมายด้านล่างนี้</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="patientName" className="text-right">ชื่อคนไข้</Label><Input id="patientName" name="patientName" value={newAppointmentForm.patientName} onChange={(e) => handleInputChange(e, 'add')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="appointmentDate" className="text-right">วันที่นัด</Label><Input id="appointmentDate" name="appointmentDate" type="date" value={newAppointmentForm.appointmentDate} onChange={(e) => handleInputChange(e, 'add')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="appointmentTime" className="text-right">เวลา</Label><Input id="appointmentTime" name="appointmentTime" type="time" value={newAppointmentForm.appointmentTime} onChange={(e) => handleInputChange(e, 'add')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="reason" className="text-right">เหตุผลการนัด</Label><Input id="reason" name="reason" value={newAppointmentForm.reason} onChange={(e) => handleInputChange(e, 'add')} className="col-span-3" /></div>
              {/* <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="patientId" className="text-right">Patient ID (ถ้ามี)</Label><Input id="patientId" name="patientId" value={newAppointmentForm.patientId} onChange={(e) => handleInputChange(e, 'add')} className="col-span-3" /></div> */}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSaving}>ยกเลิก</Button></DialogClose>
              <Button onClick={handleAddAppointment} disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกนัดหมาย"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            if (isSaving) return;
            setIsEditDialogOpen(open);
            if (!open) setEditingAppointment(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>แก้ไขนัดหมาย</DialogTitle>
              <DialogDescription>แก้ไขรายละเอียดการนัดหมายสำหรับ {currentEditForm.patientName}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editPatientName" className="text-right">ชื่อคนไข้</Label><Input id="editPatientName" name="patientName" value={currentEditForm.patientName} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editAppointmentDate" className="text-right">วันที่นัด</Label><Input id="editAppointmentDate" name="appointmentDate" type="date" value={currentEditForm.appointmentDate} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editAppointmentTime" className="text-right">เวลา</Label><Input id="editAppointmentTime" name="appointmentTime" type="time" value={currentEditForm.appointmentTime} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-3" /></div>
              <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editReason" className="text-right">เหตุผลการนัด</Label><Input id="editReason" name="reason" value={currentEditForm.reason} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-3" /></div>
              {/* <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="editPatientId" className="text-right">Patient ID (ถ้ามี)</Label><Input id="editPatientId" name="patientId" value={currentEditForm.patientId} onChange={(e) => handleInputChange(e, 'edit')} className="col-span-3" /></div> */}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline" disabled={isSaving}>ยกเลิก</Button></DialogClose>
              <Button onClick={handleUpdateAppointment} disabled={isSaving}>{isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingAppointment && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            if(isSaving) return;
            setIsDeleteDialogOpen(open);
            if (!open) setDeletingAppointment(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบ</DialogTitle>
              <DialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบนัดหมายสำหรับ {deletingAppointment.patientName} ในวันที่ {new Date(deletingAppointment.appointmentDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} เวลา {deletingAppointment.appointmentTime}?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSaving}>ยกเลิก</Button>
              <Button variant="destructive" onClick={handleDeleteAppointment} disabled={isSaving}>
                {isSaving ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isLoading && <p className="text-center py-4">กำลังโหลดข้อมูลนัดหมาย...</p>}
      {error && !isLoading && !isSaving && (
        <div className="text-center py-4 text-red-600">
          <p>เกิดข้อผิดพลาด: {error}</p>
          <Button onClick={fetchAppointments} className="mt-2" disabled={isLoading || isSaving}>ลองใหม่</Button>
        </div>
      )}
      {!isLoading && !error && appointments.length === 0 && (
         <p className="text-center py-4 text-gray-500">ไม่พบข้อมูลนัดหมาย</p>
      )}

      {!isLoading && !error && appointments.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>ชื่อคนไข้</TableHead><TableHead>วันที่</TableHead><TableHead>เวลา</TableHead><TableHead>เหตุผล</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {appointments.map((app) => (
              <TableRow key={app.id}>
                <TableCell>{app.patientName}</TableCell>
                <TableCell>{new Date(app.appointmentDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                <TableCell>{app.appointmentTime}</TableCell>
                <TableCell>{app.reason}</TableCell>
                <TableCell>{app.status}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(app)} disabled={isSaving}>
                    <Edit className="mr-1 h-3 w-3" /> แก้ไข
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(app)} disabled={isSaving}>
                    <Trash2 className="mr-1 h-3 w-3" /> ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
export default AppointmentsPage;
