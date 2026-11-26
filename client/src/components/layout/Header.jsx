import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Button, Avatar, Box, Chip, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const drawerWidth = 260;

export default function Header({ onToggleSidebar, user, onLogout }) {
  const navigate = useNavigate();

  const avatarSrc = user?.avatarUrl || user?.avatar_url || '';
  const balance = Number(user?.balance || 0);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        bgcolor: 'background.paper',
        borderBottom: '1px solid #e0e0e0',
        color: 'text.primary',
      }}
    >
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onToggleSidebar} sx={{ mr: 2, display: { md: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }} />

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Bấm để vào Ví / Nạp tiền">
              <Chip
                icon={<AccountBalanceWalletIcon />}
                label={`${balance.toLocaleString('vi-VN')} đ`}
                color="success"
                variant="outlined"
                clickable
                onClick={() => navigate('/wallet')}
                sx={{
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  px: 0.5,
                  bgcolor: 'success.50',
                  borderWidth: 1.5,
                }}
              />
            </Tooltip>

            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Xin chào,
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold">
                {user.fullName || user.email}
              </Typography>
            </Box>

            <Tooltip title="Xem trang cá nhân">
              <Avatar
                src={avatarSrc}
                alt={user.fullName || user.email}
                sx={{
                  bgcolor: 'secondary.main',
                  cursor: 'pointer',
                  transition: '0.2s',
                  border: '2px solid',
                  borderColor: 'divider',
                  '&:hover': { transform: 'scale(1.1)' },
                }}
                onClick={() => navigate('/profile')}
              >
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </Avatar>
            </Tooltip>

            <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              disableElevation
              sx={{ borderRadius: 2 }}
            >
              Đăng xuất
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
