// /frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Container, Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    const success = login(username, password);
    if (!success) {
      setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
  };

  return (
    <Container
      component="main"
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh', // Full viewport height
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4, // Equivalent to theme.spacing(4)
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%', // Ensure paper takes full width of container
        }}
      >
        <Typography component="h1" variant="h5" gutterBottom>
          เข้าสู่ระบบโรงพยาบาล
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="ชื่อผู้ใช้"
            name="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="รหัสผ่าน"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            เข้าสู่ระบบ
          </Button>
          <Typography variant="body2" color="text.secondary" align="center">
            (Demo: Username: <strong>admin</strong>, Password: <strong>password</strong>)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;