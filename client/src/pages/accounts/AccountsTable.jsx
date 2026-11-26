import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';

const ROLES = {
  1: { label: 'Admin', color: 'error' },
  2: { label: 'Operator', color: 'warning' },
  3: { label: 'Player', color: 'info' },
};

export default function AccountTable({
  accounts,
  loading,
  onChangeRole,
  onToggleStatus,
  onOpenTransaction,
  onMessageUser,
}) {
  if (!loading && accounts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
        <Typography variant="body1">No accounts found.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, mb: 3 }}>
      <Table sx={{ minWidth: 900 }} size="small" aria-label="accounts table">
        <TableHead sx={{ backgroundColor: 'action.hover' }}>
          <TableRow>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              ID
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
              Balance
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Role
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Status
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody sx={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {accounts.map((acc) => (
            <TableRow key={acc.id} hover>
              <TableCell align="center" sx={{ color: 'text.secondary' }}>
                {acc.id}
              </TableCell>

              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={acc.avatarUrl} alt={acc.fullName} sx={{ width: 40, height: 40 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {acc.fullName || 'No Name'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {acc.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{acc.phoneNumber || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {acc.address || '-'}
                </Typography>
              </TableCell>

              <TableCell align="right">
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  ${Number(acc.balance || 0).toLocaleString()}
                </Typography>
              </TableCell>

              <TableCell align="center">
                <FormControl size="small" variant="standard" sx={{ minWidth: 100 }}>
                  <Select
                    value={acc.roleId}
                    onChange={(e) => onChangeRole(acc, Number(e.target.value))}
                    disableUnderline
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      color: `${ROLES[acc.roleId]?.color}.main`,
                    }}
                  >
                    <MenuItem value={1}>Admin</MenuItem>
                    <MenuItem value={2}>Operator</MenuItem>
                    <MenuItem value={3}>Player</MenuItem>
                  </Select>
                </FormControl>
              </TableCell>

              <TableCell align="center">
                <Switch
                  checked={acc.isActive === 1}
                  onChange={(e) => onToggleStatus(acc, e.target.checked)}
                  color={acc.isActive === 1 ? 'success' : 'error'}
                />
              </TableCell>

              <TableCell align="center">
                <Tooltip title="Nhắn tin trực tiếp">
                  <IconButton size="small" color="primary" onClick={() => onMessageUser?.(acc)}>
                    <ChatIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
