import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { GAME_TYPES } from '../../utils/constants.js';
import { UploadButton } from '../../utils/uploadThing.js';

export default function GameDetailDialog({ game, onClose, vendorName, vendors, onUpdate }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (game) {
      setEditData({
        title: game.title || '',
        titleJp: game.titleJp || '',
        type: game.type || '',
        imageUrl: game.imageUrl || '',
        sortOrder: game.sortOrder || 0,
        isActive: game.isActive,
      });
      setIsEditMode(false);
      setError('');
    }
  }, [game]);

  if (!game) return null;

  const handleSave = async () => {
    if (!editData.title || editData.title.trim() === '') {
      setError('Title cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await onUpdate(game, editData);
      setIsEditMode(false);
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu game');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };
  const handleChange = (field) => (e) => setEditData({ ...editData, [field]: e.target.value });

  return (
    <Dialog open={Boolean(game)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" fontWeight="bold">
          {isEditMode ? 'Edit Game' : 'Game Details'}
        </Typography>
        <Box>
          {!isEditMode && (
            <Button
              startIcon={<EditIcon />}
              onClick={() => setIsEditMode(true)}
              size="small"
              variant="outlined"
              sx={{ mr: 1, borderRadius: 2 }}
            >
              Edit
            </Button>
          )}
          {/* Nút X chuẩn mực để đóng Modal */}
          <IconButton onClick={handleClose} size="small" color="inherit">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* PHẦN ẢNH VÀ TRẠNG THÁI */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {editData.imageUrl ? (
              <Box
                component="img"
                src={editData.imageUrl}
                alt={editData.title}
                sx={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 3, boxShadow: 2, mb: 2 }}
              />
            ) : (
              <Box
                sx={{
                  width: 140,
                  height: 140,
                  bgcolor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 3,
                  mb: 2,
                }}
              >
                <Typography variant="body2" color="text.disabled">
                  No Image
                </Typography>
              </Box>
            )}

            {isEditMode && (
              <Box sx={{ mb: 2, width: '100%', textAlign: 'center' }}>
                <UploadButton
                  endpoint="gameImageUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) setEditData((prev) => ({ ...prev, imageUrl: res[0].url }));
                  }}
                  onUploadError={(error) => alert(`ERROR! ${error.message}`)}
                />
              </Box>
            )}
            <Chip
              label={editData.isActive ? 'Active' : 'Inactive'}
              color={editData.isActive ? 'success' : 'default'}
              size="small"
            />
          </Box>

          <Divider />

          {/* CÁC TRƯỜNG THÔNG TIN */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
              Game Code & Vendor
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              [{game.gameCode}] - {vendorName || game.vendorId}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Title
              </Typography>
              {isEditMode ? (
                <TextField
                  fullWidth
                  size="small"
                  value={editData.title}
                  onChange={handleChange('title')}
                  error={Boolean(error)}
                  helperText={error}
                />
              ) : (
                <Typography variant="body1" fontWeight="bold">
                  {editData.title}
                </Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Japanese Title
              </Typography>
              {isEditMode ? (
                <TextField fullWidth size="small" value={editData.titleJp} onChange={handleChange('titleJp')} />
              ) : (
                <Typography variant="body2">{editData.titleJp || 'N/A'}</Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Type
              </Typography>
              {isEditMode ? (
                <FormControl size="small" fullWidth>
                  <Select value={editData.type} onChange={handleChange('type')}>
                    {GAME_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Chip label={editData.type} size="small" variant="outlined" />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Sort Order
              </Typography>
              {isEditMode ? (
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={editData.sortOrder}
                  onChange={handleChange('sortOrder')}
                />
              ) : (
                <Typography variant="body2">{editData.sortOrder}</Typography>
              )}
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        {isEditMode && (
          <>
            <Button onClick={() => setIsEditMode(false)} disabled={saving} color="inherit" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              startIcon={<SaveIcon />}
              variant="contained"
              disableElevation
              sx={{ borderRadius: 2 }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
