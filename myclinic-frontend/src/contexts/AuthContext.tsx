import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string } | null; // สามารถเพิ่มข้อมูล user อื่นๆ ได้
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Initialize to false
  const [user, setUser] = useState<{ username: string } | null>(null); // Initialize to null
  const navigate = useNavigate();

  // Helper function to check if localStorage is available
  const isLocalStorageAvailable = () => {
    try {
      const testKey = '__testLocalStorage__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };
  
    useEffect(() => {
      if (isLocalStorageAvailable()) {
        const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
        const storedUser = localStorage.getItem('user');
        setIsAuthenticated(storedAuth);
        setUser(storedUser ? JSON.parse(storedUser) : null);
      }
    }, []);
  
  const login = (username: string) => {
    // Mock login
    setIsAuthenticated(true);
    const mockUser = { username };
    setUser(mockUser);

    // Persist to localStorage
    if (isLocalStorageAvailable()) {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
    navigate('/dashboard');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);

    // Clear from localStorage
    if (isLocalStorageAvailable()) {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
    }
    navigate('/login'); // Redirect to login
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};