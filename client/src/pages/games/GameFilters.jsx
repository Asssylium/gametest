import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

export default function GameFilters({
  vendors,
  search,
  vendor,
  active,
  type,
  onSearchChange,
  onVendorChange,
  onActiveChange,
  onTypeChange,
}) {
  const hasActiveFilters = search || vendor || active !== '' || type !== '';

  const handleClearAll = () => {
    onSearchChange('');
    onVendorChange('');
    onActiveChange('');
    onTypeChange('');
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'center',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      <TextField
        size="small"
        label="Search title or code"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: search && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ flexGrow: 1, minWidth: '220px' }}
      />

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>All vendors</InputLabel>
        <Select value={vendor} label="All vendors" onChange={(e) => onVendorChange(e.target.value)}>
          <MenuItem value="">
            <em>All vendors</em>
          </MenuItem>
          {vendors.map((v) => (
            <MenuItem key={v.id} value={v.id}>
              {v.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Status</InputLabel>
        <Select value={active} label="Status" onChange={(e) => onActiveChange(e.target.value)}>
          <MenuItem value="">
            <em>All status</em>
          </MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Type</InputLabel>
        <Select value={type} label="Type" onChange={(e) => onTypeChange(e.target.value)}>
          <MenuItem value="">
            <em>All types</em>
          </MenuItem>
          <MenuItem value="SLOT">SLOT</MenuItem>
          <MenuItem value="LIVE">LIVE</MenuItem>
          <MenuItem value="TABLE">TABLE</MenuItem>
        </Select>
      </FormControl>

      {hasActiveFilters && (
        <Button variant="outlined" color="error" onClick={handleClearAll} startIcon={<ClearIcon />}>
          Clear All
        </Button>
      )}
    </Paper>
  );
}
