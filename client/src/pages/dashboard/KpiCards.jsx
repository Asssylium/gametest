import React from 'react';
import { Grid, Card, Box, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const StatCard = ({ title, value, icon, color }) => (
  <Card elevation={2} sx={{ borderRadius: 3, display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: `${color}.light`, color: `${color}.dark`, mr: 2 }}>{icon}</Box>
    <Box>
      <Typography variant="body2" color="text.secondary" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="h5" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  </Card>
);

export default function KpiCards({ overview }) {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Tổng Người Chơi"
          value={overview.totalPlayers}
          icon={<PeopleIcon fontSize="large" />}
          color="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Game / Vendor"
          value={`${overview.totalGames} / ${overview.totalVendors}`}
          icon={<SportsEsportsIcon fontSize="large" />}
          color="warning"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Tổng số dư (Lưu thông)"
          value={`$${Number(overview.totalSystemBalance || 0).toLocaleString()}`}
          icon={<AccountBalanceWalletIcon fontSize="large" />}
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Nạp tiền trong tháng"
          value={`$${Number(overview.monthlyDeposit || 0).toLocaleString()}`}
          icon={<TrendingUpIcon fontSize="large" />}
          color="error"
        />
      </Grid>
    </Grid>
  );
}
