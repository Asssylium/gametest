import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import Notice from '../components/common/Notice.jsx';
import { UploadButton } from '../utils/uploadThing.js';
import '@uploadthing/react/styles.css';

import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  Divider,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';

export default function ProfilePage() {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const [user, setUser] = useState({
    id: '',
    email: '',
    fullName: '',
    role: '',
    avatarUrl: '',
    phoneNumber: '',
    address: '',
    balance: 0,
  });

  const [editForm, setEditForm] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const realData = await api.getProfile();

        setUser({
          ...realData,
          fullName: realData.fullName || 'Người dùng',
          avatarUrl: realData.avatarUrl || '',
          phoneNumber: realData.phoneNumber || '(Chưa cập nhật)',
          address: realData.address || 'Chưa cập nhật',
          role: realData.roleId === 1 ? 'Admin' : realData.roleId === 2 ? 'Operator' : 'Player',
          balance: realData.balance || 0,
        });

        localStorage.setItem('user', JSON.stringify(realData));
      } catch (error) {
        console.error('Lỗi tải thông tin:', error);
        const storedUser = JSON.parse(localStorage.getItem('user')) || {};
        setUser((prev) => ({ ...prev, ...storedUser }));
      }
    };
    fetchUser();
  }, []);

  const handleOpenEdit = () => {
    setEditForm({ ...user });
    setOpenEditProfile(true);
  };
  const handleCloseEdit = () => setOpenEditProfile(false);
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      await api.updateProfile(editForm);
      setUser(editForm);
      localStorage.setItem('user', JSON.stringify(editForm));
      setNotice({ type: 'success', text: 'Đã cập nhật hồ sơ!' });
      setOpenEditProfile(false);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Cập nhật thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPassword = () => setOpenChangePassword(true);
  const handleClosePassword = () => {
    setOpenChangePassword(false);
    setPasswords({ currentPassword: '', newPassword: '' });
  };
  const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return;
    try {
      setLoading(true);
      await api.changePassword(passwords);
      setNotice({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      handleClosePassword();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Đổi mật khẩu thất bại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: 5, px: 2 }}>
      <Paper elevation={3} sx={{ maxWidth: '650px', mx: 'auto', p: 4, borderRadius: 2, bgcolor: '#ffffff' }}>
        <Notice type={notice?.type} onClose={() => setNotice(null)}>
          {notice?.text}
        </Notice>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, mt: 2 }}>
          <Avatar
            src={user.avatarUrl}
            variant="rounded"
            sx={{
              width: 120,
              height: 120,
              mb: 1,
              border: '1px solid #ddd',
              bgcolor: '#f0f0f0',
              color: '#666',
              fontSize: '3rem',
            }}
          >
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </Avatar>

          <Box
            sx={{
              '.ut-button': {
                bgcolor: '#2e7df6',
                borderRadius: '4px',
                height: '32px',
                fontSize: '0.8rem',
                px: 2,
                textTransform: 'none',
              },
              '.ut-allowed-content': { display: 'none' },
            }}
          >
            <UploadButton
              endpoint="avatarUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  const newUrl = res[0].url;
                  setUser((prev) => ({ ...prev, avatarUrl: newUrl }));
                }
              }}
              onUploadError={(error) => setNotice({ type: 'error', text: `Lỗi: ${error.message}` })}
            />
          </Box>

          <Typography variant="h4" fontWeight="800" sx={{ mt: 2, color: '#333' }}>
            {user.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {user.role}
          </Typography>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="700" sx={{ color: '#333', mb: 2 }}>
            Personal info
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '120px', fontWeight: 'bold', color: '#555', fontSize: '0.95rem' }}>
                Email:
              </Typography>
              <Link href={`mailto:${user.email}`} underline="hover" sx={{ fontSize: '0.95rem' }}>
                {user.email}
              </Link>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '120px', fontWeight: 'bold', color: '#555', fontSize: '0.95rem' }}>
                Phone:
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>{user.phoneNumber}</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '120px', fontWeight: 'bold', color: '#555', fontSize: '0.95rem' }}>
                Address:
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>{user.address}</Typography>
            </Box>
            <Divider sx={{ borderStyle: 'dashed' }} />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ width: '120px', fontWeight: 'bold', color: '#555', fontSize: '0.95rem' }}>
                Balance:
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: '#2e7df6', fontWeight: 'bold' }}>
                {new Intl.NumberFormat('vi-VN').format(user.balance)} VNĐ
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            disableElevation
            onClick={handleOpenEdit}
            sx={{ bgcolor: '#2e7df6', textTransform: 'none', borderRadius: 1.5 }}
          >
            Edit Profile
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleOpenPassword}
            sx={{ bgcolor: '#2e7df6', textTransform: 'none', borderRadius: 1.5 }}
          >
            Change Password
          </Button>
        </Box>
      </Paper>

      <Dialog open={openEditProfile} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Sửa thông tin cá nhân</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Họ và Tên"
              name="fullName"
              value={editForm.fullName || ''}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Số điện thoại"
              name="phoneNumber"
              value={editForm.phoneNumber || ''}
              onChange={handleEditChange}
              fullWidth
            />
            <TextField
              label="Địa chỉ"
              name="address"
              value={editForm.address || ''}
              onChange={handleEditChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEdit} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleUpdateProfile} variant="contained" disableElevation disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Lưu Thay Đổi'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChangePassword} onClose={handleClosePassword} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">Đổi mật khẩu</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              type="password"
              label="Mật khẩu hiện tại"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              fullWidth
            />
            <TextField
              type="password"
              label="Mật khẩu mới"
              name="newPassword"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClosePassword} color="inherit">
            Hủy
          </Button>
          <Button onClick={handleChangePassword} variant="contained" disableElevation disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Cập Nhật'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
