import React from 'react';
import { Alert, Collapse, Box } from '@mui/material';

export default function Notice({ type = 'error', onClose, children }) {
  if (!children) return null;

  const severity = type === 'success' ? 'success' : 'error';

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Collapse in={Boolean(children)}>
        <Alert severity={severity} onClose={onClose} variant="filled" sx={{ borderRadius: 2, boxShadow: 2 }}>
          {children}
        </Alert>
      </Collapse>
    </Box>
  );
}
