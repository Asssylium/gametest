import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import { api } from '../../api/client.js';

export default function TransactionDialog({ open, onClose, account, onSuccess }) {
  const [tab, setTab] = useState(0);
  const [type, setType] = useState('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Reset state khi mở Modal hoặc đổi account
  useEffect(() => {
    if (open) {
      setTab(0);
      setAmount('');
      setDescription('');
      setError('');
      setHistory([]);
    }
  }, [open, account]);

  // Tự động gọi API khi chuyển sang Tab Lịch sử (tab === 1)
  useEffect(() => {
    if (open && tab === 1 && account) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const data = await api.getTransactionHistory(account.id);
          setHistory(data);
        } catch (err) {
          console.error('Lỗi lấy lịch sử:', err);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [open, tab, account]);

  if (!account) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return setError('Số tiền phải lớn hơn 0.');

    setLoading(true);
    try {
      const payload = {
        accountId: account.id,
        amount: numAmount,
        description: description || (type === 'DEPOSIT' ? 'Admin nạp tiền' : 'Admin rút tiền'),
      };

      if (type === 'DEPOSIT') await api.deposit(payload);
      else await api.withdraw(payload);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi giao dịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Tài chính - {account.email}</DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab label="Giao dịch" fontWeight="bold" />
          <Tab label="Lịch sử" fontWeight="bold" />
        </Tabs>
      </Box>

      {/* TAB 0: GIAO DỊCH NẠP/RÚT */}
      {tab === 0 && (
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Typography variant="subtitle1" gutterBottom>
              Số dư: <strong style={{ color: '#2e7d32' }}>${Number(account.balance).toLocaleString()}</strong>
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Loại giao dịch</InputLabel>
              <Select value={type} label="Loại giao dịch" onChange={(e) => setType(e.target.value)} disabled={loading}>
                <MenuItem value="DEPOSIT" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  NẠP TIỀN (+)
                </MenuItem>
                <MenuItem value="WITHDRAW" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  RÚT TIỀN (-)
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              margin="normal"
              label="Số tiền ($)"
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
            />

            <TextField
              fullWidth
              margin="normal"
              label="Ghi chú (Tùy chọn)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={type === 'DEPOSIT' ? 'success' : 'error'}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogActions>
        </form>
      )}

      {/* TAB 1: LỊCH SỬ GIAO DỊCH */}
      {tab === 1 && (
        <DialogContent sx={{ minHeight: 300, p: 0 }}>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 5 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>Chưa có giao dịch nào.</Typography>
          ) : (
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>Thời gian</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell align="right">Số dư sau</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(tx.created_at).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color={tx.type === 'DEPOSIT' ? 'success.main' : 'error.main'}
                      >
                        {tx.type}
                      </Typography>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', color: tx.type === 'DEPOSIT' ? 'success.main' : 'error.main' }}
                    >
                      {tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">${Number(tx.balance_after).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
