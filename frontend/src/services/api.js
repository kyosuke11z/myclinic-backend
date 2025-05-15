// /frontend/src/services/api.js
import axios from 'axios';

// กำหนด Base URL ของ Backend API ของคุณ
// *** สำคัญมาก: เปลี่ยน URL นี้ให้ตรงกับ Backend ของคุณจริงๆ ***
// จากโค้ด Backend ที่ให้มา Server รันที่ Port 5000 และไม่มี prefix /api
// ถ้า Backend ของคุณรันที่ URL/Port อื่น ให้เปลี่ยนตรงนี้
const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // สามารถเพิ่ม Header อื่นๆ เช่น Authorization token ได้ที่นี่
  },
});

export default api;