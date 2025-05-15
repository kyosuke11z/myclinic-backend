import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL backend ของอัลเลน
  withCredentials: true, // กรณีใช้ cookie/session (ใส่ได้เผื่ออนาคต)
})

export default api
