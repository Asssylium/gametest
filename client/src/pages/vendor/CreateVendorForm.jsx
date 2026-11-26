import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Card, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CreateVendorForm({ onCreated, isLoading }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    onCreated({ name: name.trim(), code: code.trim() });
    setName('');
    setCode('');
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <Box sx={{ p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" fontWeight="bold">
          Thêm Nhà phát hành mới
        </Typography>
      </Box>
      <Divider />
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
      >
        <TextField
          label="Mã (VD: pragmatic)"
          variant="outlined"
          size="small"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          sx={{ width: '220px' }}
        />

        <TextField
          label="Tên (VD: Pragmatic Play)"
          variant="outlined"
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flex: 1, minWidth: '220px' }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isLoading || !name.trim() || !code.trim()}
          startIcon={<AddIcon />}
          sx={{ height: '40px', px: 3, borderRadius: 2 }}
          disableElevation
        >
          {isLoading ? 'Đang thêm...' : 'Thêm mới'}
        </Button>
      </Box>
    </Card>
  );
}
