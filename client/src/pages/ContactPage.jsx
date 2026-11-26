import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api/client.js';
import Notice from '../components/common/Notice.jsx';
import MapLibreLocationPicker from '../components/common/MapLibreLocationPicker.jsx';

export default function ContactPage() {
  const { user } = useAuth();
  const isAdmin = user?.roleId === 1;

  const [companyInfo, setCompanyInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  const [editingInfo, setEditingInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    subject: '',
    address: '',
    message: '',
  });
  const [coords, setCoords] = useState(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .getContactInfo()
      .then((data) => {
        if (mounted && data) {
          setCompanyInfo(data);
          setEditForm(data);
        }
      })
      .catch((err) => {
        if (mounted) setNotice({ type: 'error', text: err.message || 'Không tải được thông tin liên hệ.' });
      })
      .finally(() => {
        if (mounted) setLoadingInfo(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSelectLocation = ({ lat, lng, address }) => {
    if (editingInfo) {
      setEditForm((prev) => ({ ...prev, address, lat, lng }));
    } else {
      setForm((prev) => ({ ...prev, address }));
      setCoords({ lat, lng });
    }
  };

  const handleSaveCompanyInfo = async () => {
    setSavingInfo(true);
    try {
      const updated = await api.updateContactInfo(editForm);
      setCompanyInfo(updated);
      setEditForm(updated);
      setEditingInfo(false);
      setNotice({ type: 'success', text: 'Đã cập nhật thông tin & vị trí trụ sở thành công!' });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Cập nhật thất bại.' });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      setNotice({ type: 'error', text: 'Vui lòng nhập nội dung cần liên hệ.' });
      return;
    }

    setSending(true);
    try {
      const res = await api.sendContactMessage({
        ...form,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
      });
      setNotice({ type: 'success', text: res.message || 'Đã gửi email liên hệ thành công!' });
      setForm((prev) => ({ ...prev, subject: '', message: '' }));
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gửi email thất bại, vui lòng thử lại.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Liên hệ & Bản đồ
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Xem vị trí trụ sở công ty hoặc gửi phản hồi trực tiếp qua email
        </Typography>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                {companyInfo?.companyName || 'Thông tin hỗ trợ'}
              </Typography>

              {isAdmin && !editingInfo && (
                <Tooltip title="Chỉnh sửa thông tin & vị trí trụ sở">
                  <IconButton size="small" color="primary" onClick={() => setEditingInfo(true)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {loadingInfo ? (
              <CircularProgress size={22} />
            ) : editingInfo ? (
              <Stack spacing={1.5}>
                <Typography variant="caption" color="primary">
                  Mẹo: Click trực tiếp lên bản đồ bên phải để chọn lại vị trí trụ sở.
                </Typography>
                <TextField
                  label="Tên công ty / trụ sở"
                  size="small"
                  fullWidth
                  value={editForm.companyName || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
                />
                <TextField
                  label="Địa chỉ trụ sở"
                  size="small"
                  fullWidth
                  value={editForm.address || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                />
                <TextField
                  label="Số điện thoại"
                  size="small"
                  fullWidth
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                />
                <TextField
                  label="Email hỗ trợ"
                  size="small"
                  fullWidth
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                />
                <TextField
                  label="Giờ làm việc"
                  size="small"
                  fullWidth
                  value={editForm.workingHours || ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, workingHours: e.target.value }))}
                />
                <Typography variant="caption" color="text.secondary">
                  Tọa độ trụ sở: {Number(editForm.lat || 0).toFixed(5)}, {Number(editForm.lng || 0).toFixed(5)}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveCompanyInfo}
                    disabled={savingInfo}
                  >
                    {savingInfo ? 'Đang lưu...' : 'Lưu trụ sở'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setEditForm(companyInfo);
                      setEditingInfo(false);
                    }}
                  >
                    Hủy
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocationOnIcon color="error" fontSize="small" />
                  <Typography variant="body2">{companyInfo?.address}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PhoneIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{companyInfo?.phone}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <EmailIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{companyInfo?.email}</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AccessTimeIcon color="primary" fontSize="small" />
                  <Typography variant="body2">{companyInfo?.workingHours}</Typography>
                </Stack>
              </Stack>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Gửi tin nhắn cho chúng tôi
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Họ và tên"
                  size="small"
                  fullWidth
                  required
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                />
                <TextField
                  label="Email"
                  type="email"
                  size="small"
                  fullWidth
                  required
                  value={form.email}
                  onChange={handleChange('email')}
                />
                <TextField
                  label="Tiêu đề"
                  size="small"
                  fullWidth
                  required
                  value={form.subject}
                  onChange={handleChange('subject')}
                />
                <TextField
                  label="Địa chỉ của bạn (tự điền khi chọn trên bản đồ)"
                  size="small"
                  fullWidth
                  value={form.address}
                  onChange={handleChange('address')}
                />
                <TextField
                  label="Nội dung"
                  size="small"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  value={form.message}
                  onChange={handleChange('message')}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={sending}
                  startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  sx={{ fontWeight: 'bold', py: 1.2, borderRadius: 2 }}
                >
                  {sending ? 'Đang gửi email...' : 'Gửi liên hệ'}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Stack>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3, minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {editingInfo ? 'Chọn vị trí trụ sở mới trên bản đồ' : 'Bản đồ tương tác'}
            </Typography>

            {coords && !editingInfo && (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`Lat: ${coords.lat.toFixed(5)} | Lng: ${coords.lng.toFixed(5)}`}
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          <MapLibreLocationPicker
            headquarters={editingInfo ? editForm : companyInfo}
            height={480}
            onSelectLocation={handleSelectLocation}
          />
        </Paper>
      </Box>
    </Box>
  );
}
