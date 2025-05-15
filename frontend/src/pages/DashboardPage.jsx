// /frontend/src/pages/DashboardPage.jsx
import React from 'react';
import { Container, Grid, Paper, Typography, Box, Icon } from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt'; // ตัวอย่าง icon คนไข้
import EventAvailableIcon from '@mui/icons-material/EventAvailable'; // ตัวอย่าง icon นัดหมาย
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'; // ตัวอย่าง icon แพทย์

// Mock data - ในอนาคตส่วนนี้จะมาจาก API
const statsData = [
  {
    title: 'คนไข้ทั้งหมด',
    value: '1,250',
    icon: <PeopleAltIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
    color: '#E0F7FA', // Light Cyan background
    valueColor: '#00796B', // Dark Teal for value
  },
  {
    title: 'นัดหมายวันนี้',
    value: '35',
    icon: <EventAvailableIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
    color: '#FFF3E0', // Light Orange background
    valueColor: '#FF6F00', // Dark Orange for value
  },
  {
    title: 'แพทย์พร้อมให้บริการ',
    value: '42',
    icon: <LocalHospitalIcon sx={{ fontSize: 40, color: 'success.main' }} />,
    color: '#E8F5E9', // Light Green background
    valueColor: '#2E7D32', // Dark Green for value
  },
  {
    title: 'ห้องตรวจว่าง',
    value: '8',
    icon: <Typography sx={{ fontSize: 36, fontWeight: 'bold', color: 'info.main' }}>🚪</Typography>, // Emoji icon
    color: '#E1F5FE', // Light Blue background
    valueColor: '#0277BD', // Dark Blue for value
  },
];

const DashboardPage = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
        ภาพรวมระบบ ✨
      </Typography>
      <Grid container spacing={3}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0} // No default shadow, we'll add a custom border or subtle shadow
              sx={{
                p: 2.5, // Padding
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 180,
                borderRadius: '16px', // More rounded corners
                backgroundColor: stat.color, // Custom background for each card
                border: `1px solid ${stat.valueColor}33`, // Subtle border with transparency
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: `0 8px 16px 0 ${stat.valueColor}33`,
                },
              }}
            >
              <Box sx={{ mb: 1.5, color: stat.valueColor }}>{stat.icon}</Box>
              <Typography
                variant="h4"
                component="h2"
                sx={{ fontWeight: 'bold', color: stat.valueColor, mb: 0.5 }}
              >
                {stat.value}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* สามารถเพิ่มส่วนอื่นๆ ของ Dashboard ที่นี่ เช่น กราฟ หรือตารางข้อมูลล่าสุด */}
      {/* 
      <Box mt={5}>
        <Typography variant="h5" gutterBottom>กิจกรรมล่าสุด</Typography>
        <Paper sx={{ p: 2, borderRadius: '12px' }}>
          <Typography>ยังไม่มีข้อมูลกิจกรรมล่าสุด...</Typography>
        </Paper>
      </Box>
      */}
    </Container>
  );
};
export default DashboardPage;