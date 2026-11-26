import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { GAME_TYPES } from '../../utils/constants.js';
import Notice from '../../components/common/Notice.jsx';
import { UploadButton } from '../../utils/uploadThing.js';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  Typography,
  FormHelperText,
  Collapse,
  IconButton,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

const EMPTY = { vendorId: '', gameCode: '', title: '', type: GAME_TYPES[0], imageUrl: '' };

export default function CreateGameForm({ vendors, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    let value = e.target.value;
    if (field === 'vendorId' && value) value = Number(value);
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function submit(e) {
    e.preventDefault();
    const newErrors = {};

    if (!form.vendorId) newErrors.vendorId = 'Vui lòng chọn nhà cung cấp';
    if (!form.gameCode || form.gameCode.trim() === '') newErrors.gameCode = 'Vui lòng nhập mã game';
    if (!form.title || form.title.trim() === '') newErrors.title = 'Vui lòng nhập tên game';
    if (!form.type) newErrors.type = 'Vui lòng chọn loại game';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    setMessage(null);

    try {
      const game = await api.createGame(form);
      setForm(EMPTY);
      setOpen(false);
      onCreated(game);
    } catch (err) {
      setErrors(err.errors ?? {});
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ mb: 3 }}>
      {/* Nút mở Form khi đang đóng */}
      {!open && (
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
          disableElevation
          sx={{ borderRadius: 2 }}
        >
          New game
        </Button>
      )}

      {/* Form trượt xuống cực mượt */}
      <Collapse in={open}>
        <Card elevation={2} sx={{ p: 0, overflow: 'hidden' }}>
          {/* Header của Form */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              bgcolor: 'background.default',
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Tạo Game Mới
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {/* Nội dung Form */}
          <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 3 }}>
            <Notice>{message}</Notice>

            <FormControl error={!!errors.vendorId} size="small" fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select value={form.vendorId} label="Vendor" onChange={set('vendorId')}>
                <MenuItem value="">
                  <em>Select vendor</em>
                </MenuItem>
                {vendors.map((v) => (
                  <MenuItem key={v.id} value={v.id}>
                    {v.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.vendorId && <FormHelperText>{errors.vendorId}</FormHelperText>}
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                label="Game code"
                size="small"
                fullWidth
                value={form.gameCode}
                onChange={set('gameCode')}
                error={!!errors.gameCode}
                helperText={errors.gameCode}
              />
              <TextField
                label="Title"
                size="small"
                fullWidth
                value={form.title}
                onChange={set('title')}
                error={!!errors.title}
                helperText={errors.title}
              />
            </Box>

            <FormControl error={!!errors.type} size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={set('type')}>
                {GAME_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>

            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Game Image
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {form.imageUrl ? (
                  <Box
                    component="img"
                    src={form.imageUrl}
                    alt="Uploaded"
                    sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, boxShadow: 1 }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: 'grey.200',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.disabled">
                      No Image
                    </Typography>
                  </Box>
                )}
                <UploadButton
                  endpoint="gameImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) setForm((prev) => ({ ...prev, imageUrl: res[0].url }));
                  }}
                  onUploadError={(error) => alert(`Upload failed: ${error.message}`)}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setOpen(false)} disabled={saving} color="inherit">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={saving} disableElevation sx={{ borderRadius: 2 }}>
                {saving ? 'Saving...' : 'Create Game'}
              </Button>
            </Box>
          </Box>
        </Card>
      </Collapse>
    </Box>
  );
}
