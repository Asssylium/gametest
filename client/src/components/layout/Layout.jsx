import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children, menu, current, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  function handleSelect(key) {
    onNavigate(key);
    setSidebarOpen(false);
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* HEADER */}
      <Header user={user} onLogout={logout} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* SIDEBAR */}
      <Sidebar
        items={menu}
        current={current}
        open={sidebarOpen}
        onSelect={handleSelect}
        onClose={() => setSidebarOpen(false)}
      />

      {/* (MAIN CONTENT) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - 260px)` },
          overflowX: 'hidden',
        }}
      >
        <Toolbar />

        {children}
      </Box>
    </Box>
  );
}
