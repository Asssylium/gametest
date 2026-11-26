import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useAuth } from '../../context/AuthContext.jsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { api } from '../../api/client.js';
import Notice from '../../components/common/Notice.jsx';
import DepositQRModal from './DepositQRModal.jsx';

const STATUS_MAP = {
  SUCCESS: { label: 'Thành công', color: 'success' },
  PENDING: { label: 'Đang chờ', color: 'warning' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const { refreshUser } = useAuth();

  const loadWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, history] = await Promise.all([api.getProfile(), api.getMyTransactions()]);
      setBalance(Number(profile?.balance || 0));
      setTransactions(Array.isArray(history) ? history : []);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Không thể tải dữ liệu ví.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const handleDepositSuccess = (paidAmount) => {
    setNotice({
      type: 'success',
      text: `Nạp thành công ${Number(paidAmount).toLocaleString('vi-VN')} VNĐ! Số dư của bạn đã được cập nhật.`,
    });
    loadWalletData();
    refreshUser();
  };

  return (
    <Box sx={{ maxWidth: '1100px', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Ví của tôi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Quản lý số dư và lịch sử giao dịch cá nhân
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadWalletData} disabled={loading}>
          Làm mới
        </Button>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              display: 'flex',
            }}
          >
            <AccountBalanceWalletIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">
              Số dư khả dụng
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {balance.toLocaleString('vi-VN')} VNĐ
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<QrCode2Icon />}
          onClick={() => setQrModalOpen(true)}
          sx={{ fontWeight: 'bold', px: 3, py: 1.5, borderRadius: 2 }}
        >
          Nạp tiền VietQR
        </Button>
      </Paper>

      <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="bold">
            Lịch sử giao dịch
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              Bạn chưa có giao dịch nào. Hãy bấm &quot;Nạp tiền VietQR&quot; để bắt đầu!
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell>Mã giao dịch</TableCell>
                  <TableCell>Loại</TableCell>
                  <TableCell align="right">Số tiền</TableCell>
                  <TableCell align="right">Biến động số dư</TableCell>
                  <TableCell align="center">Trạng thái</TableCell>
                  <TableCell>Thời gian</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  const statusInfo = STATUS_MAP[tx.status] || {
                    label: tx.status,
                    color: 'default',
                  };

                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {tx.transaction_code}
                        </Typography>
                        {tx.description && (
                          <Typography variant="caption" color="text.secondary">
                            {tx.description}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={isDeposit ? 'Nạp tiền' : 'Rút tiền'}
                          color={isDeposit ? 'success' : 'error'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color={isDeposit ? 'success.main' : 'error.main'}>
                          {isDeposit ? '+' : '-'}
                          {Number(tx.amount).toLocaleString('vi-VN')}đ
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        {tx.status === 'SUCCESS' ? (
                          <Typography variant="caption" color="text.secondary">
                            {Number(tx.balance_before).toLocaleString('vi-VN')}đ →{' '}
                            <strong>{Number(tx.balance_after).toLocaleString('vi-VN')}đ</strong>
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tx.created_at).toLocaleString('vi-VN')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <DepositQRModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} onSuccess={handleDepositSuccess} />
    </Box>
  );
}
