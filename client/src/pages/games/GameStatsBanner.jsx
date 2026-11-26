import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { api } from '../../api/client';

export default function GameStatsBanner() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/games/stats')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((response) => setStats(response.data))
      .catch((err) => console.error('Lỗi tải thống kê game:', err));
  }, []);

  if (!stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: 'primary.dark', // Đổi sang màu xanh đậm của Theme
        color: 'primary.contrastText',
        py: 1.5,
        px: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 3,
        mb: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" fontWeight="medium">
        🎮 Tổng game:{' '}
        <Box component="span" fontWeight="bold">
          {stats.totalGames}
        </Box>
      </Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
        |
      </Typography>
      <Typography variant="body2" fontWeight="medium">
        🟢 Đang bật:{' '}
        <Box component="span" fontWeight="bold">
          {stats.activeGames}
        </Box>
      </Typography>
    </Paper>
  );
}
