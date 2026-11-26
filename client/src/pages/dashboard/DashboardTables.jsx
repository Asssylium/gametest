import React from 'react';
import {
  Grid,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';

export default function DashboardTables({ tables }) {
  if (!tables) return null;

  const recentTransactions = tables.recentTransactions || [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card elevation={2} sx={{ borderRadius: 3, p: 2 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Giao dịch gần đây
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Tài khoản</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Loại</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Số tiền
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{new Date(row.created_at || row.date).toLocaleString('vi-VN')}</TableCell>
                      <TableCell>{row.username || row.account}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.type === 'deposit' ? 'Nạp tiền' : 'Rút tiền'}
                          color={row.type === 'deposit' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${Number(row.amount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      Chưa có giao dịch nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}
