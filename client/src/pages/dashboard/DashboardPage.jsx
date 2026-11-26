import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Grid } from '@mui/material';
import { api } from '../../api/client.js';

import KpiCards from './KpiCards';
import CashFlowChart from './CashFlowChart';
import GameDistributionChart from './GameDistributionChart';
import DashboardTables from './DashboardTables';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardStats()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi tải Dashboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!data) return <Typography color="error">Không thể tải dữ liệu Dashboard.</Typography>;

  const { overview, charts, tables } = data;

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Tổng quan Hệ thống
      </Typography>

      {/* Khu vực 1: 4 Thẻ KPI */}
      <KpiCards overview={overview} />

      {/* Khu vực 2: Biểu đồ (Đã chia 50/50 theo ý bạn) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <CashFlowChart data={charts.cashFlow} />
        <GameDistributionChart data={charts.gameDistribution} />
      </Grid>

      {/* Khu vực 3: Bảng dữ liệu */}
      <DashboardTables tables={tables} />
    </Box>
  );
}
