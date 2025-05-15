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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // เพิ่ม Import Select
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Data type (should match your backend data structure for display)
interface Patient {
  id: string;
  hn: string;
  firstName: string;
  lastName: string;
  phone: string;
  lastVisit: string;
  // Add other fields if your backend sends them and you want to use them
  // e.g., gender?: string; dob?: string;
}

// Type for the form data when adding/editing
interface PatientFormData {
  hn: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender?: 'ชาย' | 'หญิง' | ''; // เพิ่ม gender, '' สำหรับค่าเริ่มต้น
  // dob?: string; // Expects YYYY-MM-DD format for date input if used
}


const API_BASE_URL = "http://localhost:5000"; // Your backend URL

function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true); // For initial data load
  const [isSaving, setIsSaving] = useState(false);   // For CUD operations
  const [error, setError] = useState<string | null>(null);

  // Add Patient Dialog
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState<PatientFormData>({
    hn: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "", // ค่าเริ่มต้นสำหรับ gender
  });

  // Edit Patient Dialog
  const [isEditPatientDialogOpen, setIsEditPatientDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null); // Stores the full patient object being edited
  const [currentEditForm, setCurrentEditForm] = useState<PatientFormData>({
    hn: "",
    firstName: "",
    lastName: "",
    phone: "",
    gender: "", // ค่าเริ่มต้นสำหรับ gender
  });

  // Delete Confirmation Dialog
  const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

  // --- Fetch Patients from Backend ---
  const fetchPatients = useCallback(async () => {
    // if (isSaving) return; // Prevent fetching if an CUD operation is in progress (optional, might cause UI flicker)
    setIsLoading(true); // Use isLoading for the main fetch
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/patients`);
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.message) errorMessage = errorJson.message;
          else errorMessage = `${errorMessage} - ${errorBody}`;
        } catch (parseError) {
          errorMessage = `${errorMessage} - ${errorBody}`;
        }
        throw new Error(errorMessage);
      }
      const dataFromBackend: any[] = await response.json(); // Expect array from backend

      // Transform data from backend to match frontend Patient interface
      const transformedPatients: Patient[] = dataFromBackend.map(p => ({
        id: String(p.id),
        hn: p.hn || `HN${String(p.id).padStart(5, '0')}`, // Use backend HN or generate
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        lastVisit: p.lastVisit ? new Date(p.lastVisit).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : (p.created_at ? new Date(p.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : ''),
        // gender: p.gender,
        // dob: p.dob ? new Date(p.dob).toISOString().split('T')[0] : '',
      }));
      setPatients(transformedPatients);
    } catch (e) {
      console.error("Failed to fetch patients:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred";
      setError(errorMessage);
      toast({ title: "เกิดข้อผิดพลาด", description: `ไม่สามารถดึงข้อมูลคนไข้ได้: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // isSaving removed from deps as it might cause issues if fetch is called during save

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);


  // --- Input Change Handler for Forms ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; // 'name' attribute on <Input>
    if (isAddPatientDialogOpen) {
      setNewPatientForm((prev) => ({ ...prev, [name]: value }));
    } else if (isEditPatientDialogOpen && editingPatient) {
      setCurrentEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };
  // Handler for Select component
  const handleGenderChange = (value: string, formType: 'add' | 'edit') => {
    const genderValue = value as 'ชาย' | 'หญิง';
    if (formType === 'add') setNewPatientForm(prev => ({ ...prev, gender: genderValue }));
    if (formType === 'edit') setCurrentEditForm(prev => ({ ...prev, gender: genderValue }));
  };

  // --- Add Patient (Call POST API) ---
  const handleAddPatient = async () => {
    if (!newPatientForm.firstName || !newPatientForm.lastName) { // HN might be auto-generated or optional
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกชื่อ และนามสกุล", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Backend expects a single 'name' field, and other fields like gender, dob
      const payload = {
        name: `${newPatientForm.firstName} ${newPatientForm.lastName}`.trim(),
        phone: newPatientForm.phone,
        gender: newPatientForm.gender || null, // ส่ง gender, ถ้าเป็น '' ให้ส่ง null
        // dob: newPatientForm.dob, // Ensure YYYY-MM-DD format if sending
      };

      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      // const result = await response.json(); // If backend returns the created patient
      toast({ title: "เพิ่มคนไข้สำเร็จ", description: `คนไข้ ${newPatientForm.firstName} ${newPatientForm.lastName} ถูกเพิ่มในระบบแล้ว` });
      setIsAddPatientDialogOpen(false);
      setNewPatientForm({ hn: "", firstName: "", lastName: "", phone: "", gender: "" }); // Reset form
      fetchPatients(); // Refetch data
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการเพิ่มคนไข้", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Edit Patient ---
  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setCurrentEditForm({ // Populate form with data from the selected patient
      hn: patient.hn,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      gender: (patient as any).gender || "", // สมมติว่า patient object อาจมี gender
    });
    setIsEditPatientDialogOpen(true);
  };

  const handleUpdatePatient = async () => {
    if (!editingPatient || !currentEditForm.firstName || !currentEditForm.lastName) {
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกชื่อ และนามสกุล", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: `${currentEditForm.firstName} ${currentEditForm.lastName}`.trim(),
        phone: currentEditForm.phone,
        gender: currentEditForm.gender || null, // ส่ง gender, ถ้าเป็น '' ให้ส่ง null
        // dob: currentEditForm.dob,
      };

      const response = await fetch(`${API_BASE_URL}/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({ title: "แก้ไขข้อมูลคนไข้สำเร็จ", description: `ข้อมูลของ ${currentEditForm.firstName} ${currentEditForm.lastName} ได้รับการอัปเดตแล้ว` });
      setIsEditPatientDialogOpen(false);
      setEditingPatient(null);
      fetchPatients(); // Refetch data
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการแก้ไขคนไข้", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Patient ---
  const openDeleteConfirmDialog = (patient: Patient) => {
    setDeletingPatient(patient);
    setIsDeleteConfirmDialogOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${deletingPatient.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorBody}`);
      }
      toast({
        title: "ลบคนไข้สำเร็จ",
        description: `คนไข้ ${deletingPatient.firstName} ${deletingPatient.lastName} ถูกลบออกจากระบบแล้ว`,
        variant: "destructive"
      });
      setIsDeleteConfirmDialogOpen(false);
      setDeletingPatient(null);
      fetchPatients(); // Refetch data
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาดในการลบคนไข้", description: (e instanceof Error ? e.message : "Unknown Error"), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto"> {/* Added container class */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">จัดการคนไข้ (Patients)</h1>
        {/* Add Patient Dialog Trigger */}
        <Dialog open={isAddPatientDialogOpen} onOpenChange={(open) => {
          if (isSaving) return; // Prevent closing dialog while saving
          setIsAddPatientDialogOpen(open);
          if (!open) setNewPatientForm({ hn: "", firstName: "", lastName: "", phone: "", gender: "" }); // Reset form on close
        }}>
          <DialogTrigger asChild>
            <Button disabled={isSaving}>
              <PlusCircle className="mr-2 h-4 w-4" /> เพิ่มคนไข้ใหม่
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>เพิ่มคนไข้ใหม่</DialogTitle>
              <DialogDescription>
                กรอกรายละเอียดของคนไข้ใหม่ด้านล่างนี้
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-hn" className="text-right">HN</Label>
                <Input id="add-hn" name="hn" value={newPatientForm.hn} onChange={handleInputChange} className="col-span-3" placeholder="ระบบจะสร้างให้อัตโนมัติ (ถ้าเว้นว่าง)" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-firstName" className="text-right">ชื่อ</Label>
                <Input id="add-firstName" name="firstName" value={newPatientForm.firstName} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-lastName" className="text-right">นามสกุล</Label>
                <Input id="add-lastName" name="lastName" value={newPatientForm.lastName} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-phone" className="text-right">เบอร์โทร</Label>
                <Input id="add-phone" name="phone" value={newPatientForm.phone} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="add-gender" className="text-right">เพศ</Label>
                <Select
                  name="gender"
                  value={newPatientForm.gender}
                  onValueChange={(value) => handleGenderChange(value, 'add')}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกเพศ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ชาย">ชาย</SelectItem>
                    <SelectItem value="หญิง">หญิง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={isSaving}>ยกเลิก</Button>
              </DialogClose>
              <Button type="button" onClick={handleAddPatient} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Patient Dialog */}
      {editingPatient && (
        <Dialog open={isEditPatientDialogOpen} onOpenChange={(open) => {
          if (isSaving) return;
          setIsEditPatientDialogOpen(open);
          if (!open) setEditingPatient(null); // Clear editing patient on close
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>แก้ไขข้อมูลคนไข้: {currentEditForm.firstName} {currentEditForm.lastName}</DialogTitle>
              <DialogDescription>
                อัปเดตรายละเอียดของคนไข้ด้านล่างนี้
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-hn" className="text-right">HN</Label>
                <Input id="edit-hn" name="hn" value={currentEditForm.hn} onChange={handleInputChange} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-firstName" className="text-right">ชื่อ</Label>
                <Input id="edit-firstName" name="firstName" value={currentEditForm.firstName} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-lastName" className="text-right">นามสกุล</Label>
                <Input id="edit-lastName" name="lastName" value={currentEditForm.lastName} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-phone" className="text-right">เบอร์โทร</Label>
                <Input id="edit-phone" name="phone" value={currentEditForm.phone} onChange={handleInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-gender" className="text-right">เพศ</Label>
                <Select
                  name="gender"
                  value={currentEditForm.gender}
                  onValueChange={(value) => handleGenderChange(value, 'edit')}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกเพศ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ชาย">ชาย</SelectItem>
                    <SelectItem value="หญิง">หญิง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditPatientDialogOpen(false)} disabled={isSaving}>ยกเลิก</Button>
              <Button type="button" onClick={handleUpdatePatient} disabled={isSaving}>
                 {isSaving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingPatient && (
        <Dialog open={isDeleteConfirmDialogOpen} onOpenChange={(open) => {
          if (isSaving) return;
          setIsDeleteConfirmDialogOpen(open);
          if (!open) setDeletingPatient(null); // Clear deleting patient on close
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>ยืนยันการลบคนไข้</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการลบคนไข้ {deletingPatient.firstName} {deletingPatient.lastName} (HN: {deletingPatient.hn})? การกระทำนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmDialogOpen(false)} disabled={isSaving}>ยกเลิก</Button>
              <Button variant="destructive" onClick={handleDeletePatient} disabled={isSaving}>
                {isSaving ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Loading, Error, Empty States */}
      {isLoading && <p className="text-center py-4">กำลังโหลดข้อมูลคนไข้...</p>}
      {error && !isLoading && !isSaving && (
        <div className="text-center py-4 text-red-600">
          <p>เกิดข้อผิดพลาด: {error}</p>
          <Button onClick={fetchPatients} className="mt-2" disabled={isLoading || isSaving}>ลองใหม่</Button>
        </div>
      )}
      {!isLoading && !error && patients.length === 0 && (
         <p className="text-center py-4 text-gray-500">ไม่พบข้อมูลคนไข้</p>
      )}

      {/* Patient Table */}
      {!isLoading && !error && patients.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>HN</TableHead>
              <TableHead className="hidden md:table-cell">ชื่อ</TableHead> {/* Hide on small screens */}
              <TableHead className="hidden md:table-cell">นามสกุล</TableHead> {/* Hide on small screens */}
              <TableHead>เบอร์โทรศัพท์</TableHead>
              <TableHead className="hidden md:table-cell">มาล่าสุด</TableHead> {/* Hide on small screens */}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow> 
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">{patient.hn}</TableCell>
                <TableCell>{patient.firstName}</TableCell>
                <TableCell>{patient.lastName}</TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.lastVisit}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(patient)} disabled={isSaving}>
                    <Edit className="mr-1 h-3 w-3" /> แก้ไข
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => openDeleteConfirmDialog(patient)} disabled={isSaving}>
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

export default PatientsPage;
