// /frontend/src/contexts/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // สามารถเก็บข้อมูล user ได้ถ้าต้องการ
  const navigate = useNavigate();

  useEffect(() => {
    // ตรวจสอบสถานะ login จาก localStorage เมื่อ component โหลด
    const storedAuth = localStorage.getItem('isAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      // อาจจะดึงข้อมูล user จาก localStorage ด้วย
      // const storedUser = localStorage.getItem('user');
      // if (storedUser) setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username, password) => {
    // Mock login: ตรวจสอบ username/password แบบง่ายๆ
    // ใน Demo นี้ใช้ admin/password
    if (username === 'admin' && password === 'password') {
      setIsAuthenticated(true);
      setUser({ username }); // เก็บ username ไว้เผื่อใช้
      localStorage.setItem('isAuthenticated', 'true');
      // localStorage.setItem('user', JSON.stringify({ username }));
      navigate('/'); // Redirect ไปหน้า Dashboard
      return true;
    }
    alert('Username หรือ Password ไม่ถูกต้อง!');
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAuthenticated');
    // localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);