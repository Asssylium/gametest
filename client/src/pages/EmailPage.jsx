import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { api } from '../api/client.js';
import Notice from '../components/common/Notice.jsx';
import RecipientSelector from '../components/emails/RecipientSelector.jsx';
import RichTextEditor from '../components/common/RichTextEditor.jsx';

export default function EmailPage() {
  const [formData, setFormData] = useState({
    subject: '',
    content: '',
    scheduledAt: '',
    targets: [],
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    if (formData.targets.length === 0) {
      setNotice({ type: 'error', text: 'Vui lòng chọn ít nhất một đối tượng nhận email!' });
      setLoading(false);
      return;
    }

    try {
      await api.scheduleEmail(formData);
      setNotice({ type: 'success', text: '✅ Lên lịch gửi email thành công!' });

      setFormData({ subject: '', content: '', scheduledAt: '', targets: [] });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Lỗi khi lên lịch gửi mail.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Email Scheduler
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Lên lịch tự động gửi email cho người dùng
        </Typography>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Tiêu đề (Subject)"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              fullWidth
              variant="outlined"
            />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Đối tượng nhận *
              </Typography>
              <RecipientSelector
                value={formData.targets}
                onChange={(newTargets) => setFormData({ ...formData, targets: newTargets })}
                onError={(msg) => setNotice({ type: 'error', text: msg })}
              />
            </Box>

            <TextField
              label="Thời gian gửi"
              type="datetime-local"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleChange}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              slotProps={{ inputLabel: { shrink: true } }}
              variant="outlined"
            />

            <RichTextEditor
              label="Nội dung Email (CKEditor)"
              value={formData.content}
              onChange={(newContent) => setFormData({ ...formData, content: newContent })}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2, height: '48px', fontWeight: 'bold' }}
            >
              {loading ? 'Đang xử lý...' : 'Lên lịch gửi ngay'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
