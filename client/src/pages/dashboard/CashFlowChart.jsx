import React from 'react';
import { Grid, Card, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function CashFlowChart({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <Grid item xs={12} md={6} sx={{ width: '100%' }}>
      <Card elevation={2} sx={{ borderRadius: 3, p: 2, width: '100%', height: '100%' }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Biểu đồ Dòng tiền (7 ngày qua)
        </Typography>
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                tickFormatter={(tick) =>
                  new Date(tick).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                }
              />
              <YAxis />
              <ChartTooltip labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total_deposit"
                name="Tiền Nạp (+)"
                stroke="#2e7d32"
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="total_withdraw" name="Tiền Rút (-)" stroke="#d32f2f" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card>
    </Grid>
  );
}
