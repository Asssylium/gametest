import React from 'react';
import { Paper, TextField, MenuItem, Select, FormControl, InputLabel, Button } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

export default function AccountFilters({ search, roleId, active, onSearchChange, onRoleChange, onActiveChange }) {
  const handleClear = () => {
    onSearchChange('');
    onRoleChange('');
    onActiveChange('');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        gap: 2,
        alignItems: 'center',
        flexWrap: 'wrap',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <TextField
        label="Search Email or Name"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 250, flexGrow: 1 }}
      />

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Role</InputLabel>
        <Select value={roleId} label="Role" onChange={(e) => onRoleChange(e.target.value)}>
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="1">Admin</MenuItem>
          <MenuItem value="2">Operator (Agent)</MenuItem>
          <MenuItem value="3">Player (User)</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Status</InputLabel>
        <Select value={active} label="Status" onChange={(e) => onActiveChange(e.target.value)}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="1">Active</MenuItem>
          <MenuItem value="0">Locked</MenuItem>
        </Select>
      </FormControl>

      <Button variant="outlined" color="inherit" onClick={handleClear} startIcon={<ClearIcon />}>
        Clear
      </Button>
    </Paper>
  );
}
