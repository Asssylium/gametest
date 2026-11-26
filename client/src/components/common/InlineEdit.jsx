import React, { useRef, useState } from 'react';
import { TextField, Button } from '@mui/material';

export default function InlineEdit({ value, inputType = 'text', onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const closed = useRef(false);

  function start() {
    closed.current = false;
    setDraft(value);
    setEditing(true);
  }

  function finish(save) {
    if (closed.current) return;
    closed.current = true;
    setEditing(false);
    if (save && draft !== value) onSave(draft);
  }

  if (!editing) {
    return (
      <Button
        variant="text"
        size="small"
        onClick={start}
        disableRipple
        sx={{
          textTransform: 'none',
          minWidth: 'auto',
          p: 0.5,
          color: value ? 'text.primary' : 'text.disabled',
          borderBottom: '1px dashed',
          borderColor: 'divider',
          borderRadius: 0,
          '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
        }}
      >
        {value || '—'}
      </Button>
    );
  }

  return (
    <TextField
      autoFocus
      size="small"
      variant="standard"
      type={inputType}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
      inputProps={{
        sx: { textAlign: 'center', fontSize: '14px', py: 0.5 },
      }}
      sx={{ width: '100px' }}
    />
  );
}
