// /frontend/src/pages/PatientsPage.jsx
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
  // IconButton, // Not used for now, can be added back if edit patient is implemented
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1'; // Icon for adding person
import HistoryIcon from '@mui/icons-material/History';
// import EditIcon from '@mui/icons-material/Edit'; // Optional: for editing patient info

const mockPatientsData = [
  { id: 1, name: 'คุณสมชาย ใจดี', phone: '081-234-5678', dob: '1980-05-15', createdAt: '2023-01-01T10:00:00Z', lastVisit: '2024-07-28', gender: 'ชาย', hn: 'HN00001', history: [{ date: '2024-07-28', note: 'ตรวจสุขภาพประจำปี', doctor: 'นพ. อาทิตย์' }, { date: '2023-01-15', note: 'ฉีดวัคซีนไข้หวัดใหญ่', doctor: 'พยาบาลวิชาชีพ' }] },
  { id: 2, name: 'คุณสมหญิง สบายดี', phone: '082-345-6789', dob: '1992-11-20', createdAt: '2023-02-10T11:30:00Z', lastVisit: '2024-07-28', gender: 'หญิง', hn: 'HN00002', history: [{ date: '2024-07-28', note: 'ปรึกษาอาการปวดหัว', doctor: 'พญ. จันทร์ฉาย' }] },
  { id: 3, name: 'คุณวิชัย มีสุข', phone: '083-456-7890', dob: '1975-02-10', createdAt: '2023-03-20T14:00:00Z', lastVisit: '2024-07-29', gender: 'ชาย', hn: 'HN00003', history: [{ date: '2024-07-29', note: 'ติดตามผลการรักษา', doctor: 'นพ. อาทิตย์' }, { date: '2024-05-10', note: 'ตรวจเลือดทั่วไป', doctor: 'นพ. อาทิตย์' }] },
];

const PatientsPage = () => {
  const [patients, setPatients] = useState(mockPatientsData); // Initialize with mock data
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [currentPatient, setCurrentPatient] = useState({ name: '', phone: '', dob: '' }); // Frontend state uses camelCase
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  // const [isEditingPatient, setIsEditingPatient] = useState(false);

  // Function to fetch patients from backend
  // const fetchPatients = async () => { /* API call logic removed */ };

  useEffect(() => {
    // No API call needed, using mock data
    console.log("PatientsPage loaded with mock data.");
  }, []);

  const handleOpenAddDialog = () => {
    setCurrentPatient({ name: '', phone: '', dob: '' }); // Reset form state
    // setIsEditingPatient(false);
    setOpenAddDialog(true); // Open the dialog
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false); // Close the dialog
  };

  const handleOpenHistoryDialog = (patient) => {
    setSelectedPatientForHistory(patient); // Set the patient object (in camelCase format)
    setOpenHistoryDialog(true); // Open the history dialog
    // History data is assumed to be part of the mock patient object for this demo
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false); // Close the history dialog
    setSelectedPatientForHistory(null); // Clear selected patient history on close
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCurrentPatient(prev => ({ ...prev, [name]: value })); // Update the currentPatient state
  };

  const handleAddPatientSubmit = async () => {
    // Basic validation
    if (!currentPatient.name || !currentPatient.phone) {
        alert('กรุณากรอกข้อมูลที่จำเป็น (ชื่อ-สกุล, เบอร์โทรศัพท์)');
        return;
    }

    const patientToAdd = { ...currentPatient };

    try {
      const newId = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
      const patientWithDetails = {
        ...patientToAdd,
        id: newId,
        hn: 'HN' + String(newId).padStart(5, '0'), // Mock HN
        createdAt: new Date().toISOString(), // Mock creation date
        lastVisit: null, // New patient has no last visit
        gender: 'ไม่ระบุ', // Default gender for mock
        history: [] // New patient has no history
      };
      setPatients(prev => [...prev, patientWithDetails]);
      console.log('Mock Adding new patient:', patientWithDetails);
      alert(`ผู้ป่วย ${patientWithDetails.name} ได้ถูกเพิ่มแล้ว (Mock)`);
      handleCloseAddDialog(); // Close the dialog
    } catch (error) {
      console.error('Error in mock adding patient:', error);
      alert('เกิดข้อผิดพลาดในการเพิ่มผู้ป่วย (Mock Error)');
    }
  };

  // Helper function to format dates (e.g., for dateOfBirth, lastVisit)
  const formatDate = (dateString, options = { year: 'numeric', month: 'long', day: 'numeric' }) => {
    if (!dateString) return '-';
    try {
      // Assuming dateString is in 'YYYY-MM-DD' or a format Date can parse
      return new Date(dateString).toLocaleDateString('th-TH', options);
    } catch (e) {
      console.error('Error formatting date:', dateString, e);
      return dateString; // Return original if parsing fails
    }
  };

  // Helper function to format date/time (e.g., for createdAt)
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
        // Assuming dateTimeString is a full ISO string or similar (like created_at)
        return new Date(dateTimeString).toLocaleString('th-TH', { // Use toLocaleString for date and time
            year: 'numeric',
            month: 'long', // Use long month name for clarity
            day: 'numeric',
            hour: '2-digit', // Include hour
            minute: '2-digit', // Include minute
        });
    } catch(e) {
        console.error('Error formatting datetime:', dateTimeString, e);
        return dateTimeString; // Return original if parsing fails
    }
  };


  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          🧑‍🦰 จัดการผู้ป่วย
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PersonAddAlt1Icon />}
          onClick={handleOpenAddDialog} // Call handleOpenAddDialog for adding
          sx={{ borderRadius: '20px', px: 3 }}
        >
          เพิ่มผู้ป่วยใหม่
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="patients table">
          <TableHead sx={{ backgroundColor: 'secondary.light', '& .MuiTableCell-head': { color: 'secondary.contrastText', fontWeight: 'bold' } }}>
            <TableRow>
              <TableCell>ชื่อ-สกุล</TableCell>
              <TableCell>เบอร์โทรศัพท์</TableCell>
              <TableCell>วันเกิด</TableCell>
              <TableCell>วันที่ลงทะเบียน</TableCell>
              <TableCell>วันที่มาล่าสุด</TableCell>
              <TableCell align="right">ดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.length > 0 ? ( // Check if patients array is not empty
              patients.map((patient) => (
                <TableRow key={patient.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">{patient.name || '-'}</TableCell> {/* Display combined name */}
                  <TableCell>{patient.phone || '-'}</TableCell> {/* Display phone */}
                  <TableCell>{formatDate(patient.dob)}</TableCell> {/* Display formatted dob */}
                  <TableCell>{formatDateTime(patient.createdAt)}</TableCell> {/* Display formatted createdAt from mock */}
                  <TableCell>{formatDate(patient.lastVisit)}</TableCell> {/* Display formatted lastVisit */}
                  <TableCell align="right">
                    {/* Optional Edit Patient Button */}
                    {/* <IconButton color="primary" onClick={() => handleOpenAddDialog(patient)} aria-label={`edit patient ${patient.id}`}><EditIcon /></IconButton> */}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => handleOpenHistoryDialog(patient)} // Call handleOpenHistoryDialog with patient object
                      sx={{ mr: 1 }}
                    >
                      ดูประวัติ
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow> {/* Row to display message when no data */}
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}> {/* colspan should cover all columns */}
                  <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    ยังไม่มีข้อมูลผู้ป่วย
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for Adding Patient */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: 'secondary.main', color: 'secondary.contrastText' }}>
          {/* {isEditingPatient ? 'แก้ไขข้อมูลผู้ป่วย' : 'เพิ่มผู้ป่วยใหม่'} */}
          เพิ่มผู้ป่วยใหม่
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField margin="dense" name="name" label="ชื่อ-สกุล" type="text" fullWidth variant="outlined" value={currentPatient.name} onChange={handleChange} required />
          <TextField margin="dense" name="phone" label="เบอร์โทรศัพท์" type="tel" fullWidth variant="outlined" value={currentPatient.phone} onChange={handleChange} required /> {/* Make phone required */}
          <TextField margin="dense" name="dob" label="วันเกิด" type="date" fullWidth variant="outlined" value={currentPatient.dob} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          {/* Consider adding a Gender field here if your backend requires it and you want users to input it */}
          {/* Example:
            <TextField margin="dense" name="gender" label="เพศ" select fullWidth variant="outlined" value={currentPatient.gender || ''} onChange={handleChange}>
              <MenuItem value="ชาย">ชาย</MenuItem>
              <MenuItem value="หญิง">หญิง</MenuItem>
              <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
            </TextField>
          */}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAddDialog} color="inherit">ยกเลิก</Button>
          <Button onClick={handleAddPatientSubmit} variant="contained" color="secondary">
            เพิ่มผู้ป่วย
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for Viewing Patient History */}
      {selectedPatientForHistory && (
        <Dialog open={openHistoryDialog} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
            ประวัติการนัดหมายของ: {selectedPatientForHistory.name}
            {selectedPatientForHistory && selectedPatientForHistory.hn && ` (HN: ${selectedPatientForHistory.hn})`} {/* Display HN if available */}
          </DialogTitle>
          <DialogContent dividers>            
            {/* Display mock history from the patient object */}
            {selectedPatientForHistory && selectedPatientForHistory.history && selectedPatientForHistory.history.length > 0 ? (
              <List>
                {selectedPatientForHistory.history.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primaryTypographyProps={{ fontWeight: 'bold' }}
                        // Assuming history item has properties like: id, appointment_date, appointment_time, reason, doctor_name
                        primary={`${formatDate(item.date, { dateStyle: 'full' })} - โดย ${item.doctor || 'ไม่ระบุแพทย์'}`}
                        secondary={item.note}
                      />
                    </ListItem>
                    {index < selectedPatientForHistory.history.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography sx={{ p: 2 }}>ไม่มีประวัติการนัดหมายสำหรับผู้ป่วยนี้ (Mock)</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseHistoryDialog} color="primary" variant="contained">ปิด</Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default PatientsPage;
