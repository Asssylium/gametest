import React from 'react';
import { Grid, Card, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

// Bảng màu đẹp dành cho biểu đồ tròn
const COLORS = ['#1976d2', '#2e7d32', '#9c27b0', '#ed6c02', '#d32f2f', '#0288d1'];

export default function GameDistributionChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Grid item xs={12} md={6} sx={{ width: '100%' }}>
      <Card elevation={2} sx={{ borderRadius: 3, p: 2, width: '100%', height: '100%' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Cơ cấu Loại Game
        </Typography>
        <Box sx={{ height: 350, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius="70%"
                fill="#8884d8"
                dataKey="count"
                nameKey="type"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Grid>
  );
}
