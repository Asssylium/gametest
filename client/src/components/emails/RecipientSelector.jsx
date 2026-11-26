import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { api } from '../../api/client.js';

export default function RecipientSelector({ value = [], onChange, onError }) {
  const [selectorValue, setSelectorValue] = useState('');

  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [userOptions, setUserOptions] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let active = true;
    if (searchEmail.length < 2) {
      setUserOptions([]);
      return;
    }

    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const res = await api.getAccounts({ search: searchEmail, limit: 10 });
        if (active) {
          console.log('Dữ liệu tìm User:', res);

          let usersArray = [];
          if (Array.isArray(res.data)) usersArray = res.data;
          else if (Array.isArray(res.data?.accounts)) usersArray = res.data.accounts;
          else if (Array.isArray(res.data?.rows)) usersArray = res.data.rows;
          else if (Array.isArray(res.accounts)) usersArray = res.accounts;
          else if (Array.isArray(res)) usersArray = res;

          setUserOptions(usersArray);
        }
      } catch (error) {
        console.error('Lỗi tìm user:', error);
      } finally {
        if (active) setLoadingUsers(false);
      }
    };

    const timer = setTimeout(fetchUsers, 500); // Debounce 500ms
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchEmail]);

  const handleAddTarget = (newTarget) => {
    const currentList = [...value];
    const hasAll = currentList.some((t) => t.type === 'ALL');

    if (newTarget.type === 'ALL') {
      onChange([newTarget]);
      return;
    }

    if (hasAll) {
      onError('Đã chọn Tất cả tài khoản, không cần chọn thêm.');
      return;
    }

    if (newTarget.type === 'ROLE') {
      const isRoleExist = currentList.some((t) => t.type === 'ROLE' && t.value === newTarget.value);
      if (isRoleExist) {
        onError('Nhóm quyền này đã được chọn.');
        return;
      }

      const filteredList = currentList.filter(
        (t) => !(t.type === 'USER' && String(t.roleId) === String(newTarget.value))
      );
      onChange([...filteredList, newTarget]);
      return;
    }

    if (newTarget.type === 'USER') {
      const isCoveredByRole = currentList.some(
        (t) => t.type === 'ROLE' && String(t.value) === String(newTarget.roleId)
      );
      if (isCoveredByRole) {
        onError('Người này đã nằm trong Nhóm quyền bạn vừa chọn.');
        return;
      }

      const isUserExist = currentList.some((t) => t.type === 'USER' && t.id === newTarget.id);
      if (isUserExist) {
        onError('Người này đã được chọn trước đó.');
        return;
      }

      onChange([...currentList, newTarget]);
    }
  };

  const handleSelectChange = (e) => {
    const val = e.target.value;
    setSelectorValue('');

    if (val === 'ALL') {
      handleAddTarget({ type: 'ALL', label: 'Tất cả tài khoản' });
    } else if (val === 'ROLE_1') {
      handleAddTarget({ type: 'ROLE', value: '1', label: 'Nhóm: Admin' });
    } else if (val === 'ROLE_2') {
      handleAddTarget({ type: 'ROLE', value: '2', label: 'Nhóm: Operator (Mentor)' });
    } else if (val === 'ROLE_3') {
      handleAddTarget({ type: 'ROLE', value: '3', label: 'Nhóm: Player (User)' });
    } else if (val === 'SPECIFIC_USER') {
      setOpenUserDialog(true);
    }
  };

  const handleRemoveChip = (targetToRemove) => {
    const newList = value.filter((t) => t !== targetToRemove);
    onChange(newList);
  };

  const handleConfirmAddUser = () => {
    if (selectedUser) {
      handleAddTarget({
        type: 'USER',
        id: selectedUser.id,
        email: selectedUser.email,
        roleId: selectedUser.roleId,
        label: `User: ${selectedUser.email}`,
      });
      setOpenUserDialog(false);
      setSelectedUser(null);
      setSearchEmail('');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          minHeight: '48px',
          border: '1px solid #ccc',
          borderRadius: 1,
          p: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          bgcolor: '#fafafa',
        }}
      >
        {value.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ p: 0.5 }}>
            Chưa có đối tượng nào được chọn
          </Typography>
        )}
        {value.map((target, index) => (
          <Chip
            key={index}
            label={target.label}
            onDelete={() => handleRemoveChip(target)}
            color={target.type === 'ALL' ? 'error' : target.type === 'ROLE' ? 'primary' : 'default'}
          />
        ))}
      </Box>

      <TextField
        select
        label="Thêm đối tượng nhận"
        value={selectorValue}
        onChange={handleSelectChange}
        fullWidth
        variant="outlined"
      >
        <MenuItem value="ALL">Tất cả tài khoản</MenuItem>
        <MenuItem value="ROLE_1">Nhóm: Admin</MenuItem>
        <MenuItem value="ROLE_2">Nhóm: Operator (Mentor)</MenuItem>
        <MenuItem value="ROLE_3">Nhóm: Player (Học viên)</MenuItem>
        <MenuItem value="SPECIFIC_USER" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          + Chọn người dùng cụ thể bằng Email
        </MenuItem>
      </TextField>

      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tìm kiếm người dùng</DialogTitle>
        <DialogContent sx={{ minHeight: '150px', pt: 1 }}>
          <Autocomplete
            options={userOptions}
            getOptionLabel={(option) => option.email || ''}
            loading={loadingUsers}
            onInputChange={(e, newInputValue) => setSearchEmail(newInputValue)}
            onChange={(e, newValue) => setSelectedUser(newValue)}
            noOptionsText={searchEmail.length < 2 ? 'Gõ ít nhất 2 ký tự...' : 'Không tìm thấy user'}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Nhập Email để tìm..."
                variant="outlined"
                margin="normal"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}

                      {params.InputProps?.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Hủy</Button>
          <Button onClick={handleConfirmAddUser} variant="contained" disabled={!selectedUser}>
            Thêm người này
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
