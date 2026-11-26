import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../api/client.js';

const PRESET_AMOUNTS = [2000, 10000, 50000, 100000, 200000, 500000];

export default function DepositQRModal({ open, onClose, onSuccess }) {
  const [amount, setAmount] = useState('50000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrData, setQrData] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const handleClose = () => {
    setQrData(null);
    setError('');
    setLoading(false);
    setCopiedField('');
    onClose();
  };

  const handleCreateQR = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 2000) {
      setError('Số tiền nạp tối thiểu là 2,000 VNĐ');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.createDepositQR(numAmount);
      setQrData(data);
    } catch (err) {
      setError(err.message || 'Không thể tạo mã QR. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !qrData?.orderCode) return;

    const intervalId = setInterval(async () => {
      try {
        const statusData = await api.checkPaymentStatus(qrData.orderCode);
        if (statusData?.status === 'SUCCESS') {
          clearInterval(intervalId);
          onSuccess?.(qrData.amount);
          handleClose();
        }
      } catch (err) {
        console.error('Polling payment status error:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [open, qrData]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 1500);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight="bold">{qrData ? 'Quét mã VietQR để nạp tiền' : 'Nạp tiền vào ví'}</DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!qrData ? (
          <Box component="form" id="deposit-qr-form" onSubmit={handleCreateQR}>
            <TextField
              label="Số tiền muốn nạp (VNĐ)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: 2000, step: 1000 }}
              helperText="Tối thiểu 2,000 VNĐ (bạn có thể chọn 2,000đ để test nhanh)"
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Chọn nhanh mệnh giá:
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {PRESET_AMOUNTS.map((preset) => (
                <Chip
                  key={preset}
                  label={`${preset.toLocaleString('vi-VN')}đ`}
                  onClick={() => setAmount(String(preset))}
                  color={Number(amount) === preset ? 'primary' : 'default'}
                  variant={Number(amount) === preset ? 'filled' : 'outlined'}
                  clickable
                />
              ))}
            </Stack>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#fff',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <QRCodeSVG value={qrData.qrCode} size={220} level="M" />
            </Box>

            <Stack direction="row" alignItems="center" spacing={1} color="primary.main">
              <CircularProgress size={16} />
              <Typography variant="body2" fontWeight="medium">
                Đang chờ xác nhận chuyển khoản...
              </Typography>
            </Stack>

            <Divider flexItem />

            <Stack spacing={1} sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Số tiền:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                  {Number(qrData.amount).toLocaleString('vi-VN')} VNĐ
                </Typography>
              </Box>

              {qrData.accountName && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chủ TK:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {qrData.accountName}
                  </Typography>
                </Box>
              )}

              {qrData.accountNumber && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Số TK:
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" fontWeight="bold">
                      {qrData.accountNumber}
                    </Typography>
                    <Tooltip title={copiedField === 'acc' ? 'Đã copy!' : 'Copy số TK'}>
                      <IconButton size="small" onClick={() => handleCopy(qrData.accountNumber, 'acc')}>
                        {copiedField === 'acc' ? (
                          <CheckCircleIcon fontSize="small" color="success" />
                        ) : (
                          <ContentCopyIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nội dung CK:
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="body2" fontWeight="bold">
                    {qrData.description}
                  </Typography>
                  <Tooltip title={copiedField === 'desc' ? 'Đã copy!' : 'Copy nội dung'}>
                    <IconButton size="small" onClick={() => handleCopy(qrData.description, 'desc')}>
                      {copiedField === 'desc' ? (
                        <CheckCircleIcon fontSize="small" color="success" />
                      ) : (
                        <ContentCopyIcon fontSize="small" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            </Stack>

            {qrData.checkoutUrl && (
              <Button
                size="small"
                variant="text"
                endIcon={<OpenInNewIcon />}
                href={qrData.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mở trang thanh toán payOS
              </Button>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {qrData ? 'Đóng' : 'Hủy'}
        </Button>

        {!qrData && (
          <Button type="submit" form="deposit-qr-form" variant="contained" disabled={loading}>
            {loading ? 'Đang tạo mã...' : 'Tạo mã VietQR'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
