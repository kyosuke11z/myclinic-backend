// /frontend/src/pages/AppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const mockAppointments = [
  { id: 1, patientName: 'คุณสมชาย ใจดี', phone: '0812345678', dateTime: '2024-08-05T10:00', notes: 'ตรวจสุขภาพประจำปี', doctor: 'นพ. อาทิตย์', status: 'Confirmed' },
  { id: 2, patientName: 'คุณสมหญิง สบายดี', phone: '0823456789', dateTime: '2024-08-05T11:30', notes: 'ปรึกษาอาการปวดหัว', doctor: 'พญ. จันทร์ฉาย', status: 'Pending' },
  { id: 3, patientName: 'คุณวิชัย มีสุข', phone: '0834567890', dateTime: '2024-08-06T14:00', notes: 'ติดตามผลการรักษา', doctor: 'นพ. อาทิตย์', status: 'Completed' },
];

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState(mockAppointments); // Initialize with mock data
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState({
    id: null, // Add id for editing
    patientName: '', // camelCase for Frontend state/UI
    phone: '', // camelCase
    dateTime: '', // camelCase
    notes: '', // camelCase
    doctor: '', // camelCase
    patient_id: null, // snake_case (match DB/Backend if needed in state)
    status: 'Pending' // camelCase
  });
  const [isEditing, setIsEditing] = useState(false); // To handle edit mode

  // Function to fetch appointments from backend
  // const fetchAppointments = async () => { /* API call logic removed */ };

  useEffect(() => {
    // No API call needed, using mock data
    console.log("AppointmentsPage loaded with mock data.");
  }, []);

  const handleOpenDialog = (appointment = null) => {
    if (appointment) {
      // When editing, use the data from the selected appointment (which is already in camelCase)
      setCurrentAppointment({
        id: appointment.id,
        patientName: appointment.patientName,
        phone: appointment.phone || '', // Use existing phone or empty string
        dateTime: appointment.dateTime, // Use existing dateTime
        notes: appointment.notes,
        doctor: appointment.doctor,
        patient_id: appointment.patient_id || null,
        status: appointment.status || 'Pending'
      });
      setIsEditing(true);
    } else {
      // When adding new, reset the form state
      setCurrentAppointment({
        id: null,
        patientName: '',
        phone: '',
        dateTime: '',
        notes: '',
        doctor: '',
        patient_id: null,
        status: 'Pending'
      });
      setIsEditing(false);
    }
    setOpenDialog(true); // Open the dialog
  };

  const handleCloseDialog = () => {
    setOpenDialog(false); // Close the dialog
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCurrentAppointment(prev => ({ ...prev, [name]: value })); // Update the currentAppointment state
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!currentAppointment.patientName || !currentAppointment.dateTime || !currentAppointment.doctor) {
        alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อคนไข้, วันเวลา, แพทย์)');
        return;
    }

    const appointmentToSave = { ...currentAppointment };

    try {
      if (isEditing) {
        // Mock update in state
        setAppointments(prev => prev.map(app => app.id === appointmentToSave.id ? appointmentToSave : app));
        console.log('Mock Updating appointment:', appointmentToSave);
      } else {
        // Mock add to state
        const newId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1;
        const appointmentToAdd = { ...appointmentToSave, id: newId };
        setAppointments(prev => [...prev, appointmentToAdd]);
        console.log('Mock Adding new appointment:', appointmentToAdd);
      }
      alert(`นัดหมายสำหรับ ${appointmentToSave.patientName} ได้ถูก${isEditing ? 'แก้ไข' : 'เพิ่ม'}แล้ว (Mock)`);
      handleCloseDialog(); // Close the dialog
    } catch (error) {
      console.error(`Error in mock ${isEditing ? 'updating' : 'adding'} appointment:`, error);
      alert(`เกิดข้อผิดพลาดในการ${isEditing ? 'แก้ไข' : 'เพิ่ม'}นัดหมาย (Mock Error)`);
    }
  };

  const handleDelete = (id) => {
    // Delete appointment via API (Backend DELETE /appointments/:id)
    if (window.confirm(`คุณต้องการลบนัดหมาย ID: ${id} หรือไม่?`)) { // Confirm before deleting
      try {
        setAppointments(prev => prev.filter(app => app.id !== id));
        console.log('Mock Deleting appointment with id:', id);
        alert(`นัดหมาย ID: ${id} ถูกลบแล้ว (Mock)`);
      } catch (error) {
        console.error('Error in mock deleting appointment:', error);
        alert(`เกิดข้อผิดพลาดในการลบนัดหมาย ID: ${id} (Mock Error)`);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          📅 รายการนัดหมาย
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenDialog} // Call handleOpenDialog without arguments for adding
          sx={{ borderRadius: '20px', px: 3 }}
        >
          เพิ่มนัดใหม่
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="appointments table">
          <TableHead sx={{ backgroundColor: 'primary.light', '& .MuiTableCell-head': { color: 'primary.contrastText', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell>ชื่อคนไข้</TableCell>
              <TableCell>วันที่/เวลา</TableCell>
              <TableCell>แพทย์</TableCell>
              <TableCell>หมายเหตุ</TableCell>
              <TableCell align="right">ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {appointments.length > 0 ? ( // Check if appointments array is not empty
              appointments.map((row) => (
                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>{/* Start TableRow */}
                  <TableCell component="th" scope="row">{row.patientName || '-'}</TableCell>{/* TableCell 1 */}
                  <TableCell>{new Date(row.dateTime).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>{/* TableCell 2 */}
                  <TableCell>{row.doctor || '-'}</TableCell>{/* TableCell 3 */}
                  <TableCell>{row.notes || '-'}</TableCell>{/* TableCell 4 */}
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleOpenDialog(row)} aria-label={`edit appointment ${row.id}`}><EditIcon /></IconButton> {/* Edit button */}
                    <IconButton color="error" onClick={() => handleDelete(row.id)} aria-label={`delete appointment ${row.id}`}><DeleteIcon /></IconButton> {/* Delete button */}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow> {/* Row to display message when no data */}
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>{/* TableCell for "No Data" message */}
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ยังไม่มีข้อมูลนัดหมาย
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Adding/Editing Appointment */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          {isEditing ? 'แก้ไขนัดหมาย' : 'เพิ่มนัดหมายใหม่'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}> {/* Add padding top to content */}
          <TextField
            margin="dense"
            name="patientName"
            label="ชื่อคนไข้"
            type="text"
            fullWidth
            variant="outlined"
            value={currentAppointment.patientName}
            onChange={handleChange}
            required
            // Consider disabling this field if editing, and patientName should come from patient_id
            // disabled={isEditing}
          />
          {/* Phone field is not in appointments table schema, remove or clarify its purpose */}
          {/* <TextField
            margin="dense"
            name="phone"
            label="เบอร์โทรศัพท์ (ถ้ามี)"
            type="tel"
            fullWidth
            variant="outlined"
            value={currentAppointment.phone}
            onChange={handleChange}
          /> */}
          <TextField
            margin="dense"
            name="dateTime"
            label="วันและเวลา"
            type="datetime-local"
            fullWidth
            variant="outlined"
            value={currentAppointment.dateTime}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            margin="dense"
            name="doctor"
            label="แพทย์"
            type="text"
            fullWidth
            variant="outlined"
            value={currentAppointment.doctor}
            onChange={handleChange}
            required
          />
          <TextField
            margin="dense"
            name="notes"
            label="รายละเอียด/หมายเหตุ"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={currentAppointment.notes}
            onChange={handleChange}
          />
          {/* Optional: Add Patient ID field if linking appointments to patients */}
          {/* <TextField
            margin="dense"
            name="patient_id"
            label="Patient ID"
            type="number"
            fullWidth
            variant="outlined"
            value={currentAppointment.patient_id || ''}
            onChange={handleChange}
          /> */}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="inherit">ยกเลิก</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{isEditing ? 'บันทึกการแก้ไข' : 'เพิ่มนัดหมาย'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AppointmentsPage;
