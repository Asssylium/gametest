import React from 'react';
import { Pagination as MuiPagination, Box } from '@mui/material';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(event, value) => onChange(value)}
        color="primary"
        shape="rounded"
        showFirstButton
        showLastButton
      />
    </Box>
  );
}
