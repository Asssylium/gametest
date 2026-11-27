import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Button,
  TextField,
  Divider,
  CircularProgress,
} from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ReplyIcon from '@mui/icons-material/Reply';
import RefreshIcon from '@mui/icons-material/Refresh';

import { api } from '../../api/client.js';
import { useSocket } from '../../context/SocketContext.jsx';
import Notice from '../../components/common/Notice.jsx';

export default function AdminInboxPage() {
  const { socket, setUnreadCount, polling } = useSocket();

  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadMessages = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await api.getContactMessages();
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(list);
      setUnreadCount(Number(data?.unreadCount || 0));
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Không tải được hộp thư.' });
    } finally {
      setLoading(false);
    }
  }, [selectedId, setUnreadCount]);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    if (!polling) return;
    const interval = window.setInterval(() => loadMessages(true), 10000);
    return () => window.clearInterval(interval);
  }, [polling, loadMessages]);

  // Lắng nghe tin nhắn mới real-time qua Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev];
      });
      setUnreadCount((prev) => prev + 1);
      setNotice({
        type: 'info',
        text: `Tin nhắn mới từ ${newMsg.fullName}: "${newMsg.subject}"`,
      });
    };

    socket.on('inbox:new_message', handleNewMessage);
    return () => {
      socket.off('inbox:new_message', handleNewMessage);
    };
  }, [socket, setUnreadCount]);

  const selectedMessage = messages.find((m) => m.id === selectedId) || null;

  const handleSelectMessage = async (msg) => {
    setSelectedId(msg.id);
    setReplyText(msg.adminReply || '');
    if (!msg.isRead) {
      try {
        const updated = await api.markContactMessageRead(msg.id);
        setMessages((prev) => prev.map((item) => (item.id === msg.id ? updated : item)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Mark read error:', err);
      }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const updated = await api.replyContactMessage(selectedMessage.id, replyText.trim());
      setMessages((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNotice({ type: 'success', text: 'Đã gửi email phản hồi tới người dùng!' });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Gửi phản hồi thất bại.' });
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Hộp thư liên hệ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {polling ? 'Tin nhắn mới được cập nhật định kỳ' : 'Tự động nhận tin nhắn mới qua Socket.IO'}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadMessages()} disabled={loading}>
          Làm mới
        </Button>
      </Box>

      <Notice type={notice?.type} onClose={() => setNotice(null)}>
        {notice?.text}
      </Notice>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Danh sách tin nhắn ({messages.length})
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={24} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Chưa có tin nhắn liên hệ nào.</Typography>
            </Box>
          ) : (
            <List disablePadding sx={{ maxHeight: 540, overflowY: 'auto' }}>
              {messages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <ListItemButton
                    selected={msg.id === selectedId}
                    onClick={() => handleSelectMessage(msg)}
                    sx={{
                      bgcolor: !msg.isRead ? 'action.hover' : 'transparent',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                          <Typography variant="body2" fontWeight={!msg.isRead ? 'bold' : 'medium'} noWrap>
                            {msg.subject}
                          </Typography>
                          {!msg.isRead ? (
                            <Chip label="Mới" color="error" size="small" />
                          ) : msg.repliedAt ? (
                            <Chip label="Đã trả lời" color="success" size="small" variant="outlined" />
                          ) : null}
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" display="block" color="text.primary">
                            {msg.fullName} ({msg.email})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(msg.createdAt).toLocaleString('vi-VN')}
                          </Typography>
                        </>
                      }
                    />
                  </ListItemButton>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          {!selectedMessage ? (
            <Typography color="text.secondary">Chọn một tin nhắn bên trái để xem chi tiết.</Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  {selectedMessage.subject}
                </Typography>
                {selectedMessage.isRead && (
                  <Chip icon={<MarkEmailReadIcon />} label="Đã đọc" size="small" variant="outlined" />
                )}
              </Stack>

              <Typography variant="body2" color="text.secondary">
                <strong>Người gửi:</strong> {selectedMessage.fullName} &lt;{selectedMessage.email}&gt;
              </Typography>
              {selectedMessage.address && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Địa chỉ:</strong> {selectedMessage.address}
                </Typography>
              )}
              {selectedMessage.lat && selectedMessage.lng && (
                <Typography variant="caption" color="text.secondary">
                  Tọa độ: {selectedMessage.lat}, {selectedMessage.lng}
                </Typography>
              )}

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {selectedMessage.message}
                </Typography>
              </Paper>

              <Divider />

              <Box component="form" onSubmit={handleReply}>
                <TextField
                  label="Nội dung phản hồi qua email"
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button type="submit" variant="contained" startIcon={<ReplyIcon />} disabled={sendingReply}>
                  {sendingReply ? 'Đang gửi email...' : 'Gửi phản hồi'}
                </Button>
              </Box>
            </Stack>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
