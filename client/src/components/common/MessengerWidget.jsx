import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Stack,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  Divider,
} from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

export default function MessengerWidget() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [openBox, setOpenBox] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [partners, setPartners] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const rawMyId = user?.id ?? user?.userId;
  const myId = rawMyId ? Number(rawMyId) : null;

  const loadPartners = useCallback(async () => {
    if (!user || !myId) return;
    try {
      const list = await api.getChatPartners();
      setPartners(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Load chat partners error:', err);
    }
  }, [user, myId]);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  useEffect(() => {
    if (!myId) return;

    const handleOpenEvent = async (e) => {
      const target = e.detail;
      if (!target?.id || Number(target.id) === myId) return;
      setOpenBox(true);
      setMinimized(false);
      setActiveUser(target);
      try {
        const history = await api.getMessagesWith(target.id);
        setMessages(Array.isArray(history) ? history : []);
        await api.markConversationRead(target.id);
        loadPartners();
      } catch (err) {
        console.error('Open DM chat error:', err);
      }
    };

    window.addEventListener('open-dm-chat', handleOpenEvent);
    return () => window.removeEventListener('open-dm-chat', handleOpenEvent);
  }, [myId, loadPartners]);

  useEffect(() => {
    if (!socket || !myId) return;

    const handleReceive = async (msg) => {
      const isCurrentChat =
        activeUser &&
        ((Number(msg.senderId) === Number(activeUser.id) && Number(msg.receiverId) === myId) ||
          (Number(msg.senderId) === myId && Number(msg.receiverId) === Number(activeUser.id)));

      if (isCurrentChat) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (Number(msg.senderId) === Number(activeUser.id) && openBox && !minimized) {
          await api.markConversationRead(activeUser.id);
        }
      }
      loadPartners();
    };

    socket.on('dm:receive', handleReceive);
    return () => socket.off('dm:receive', handleReceive);
  }, [socket, myId, activeUser, openBox, minimized, loadPartners]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, openBox, minimized]);

  if (!user || !myId) return null;

  const totalUnread = partners.reduce((sum, p) => sum + Number(p.unreadCount || 0), 0);

  const handleOpenConversation = async (partner) => {
    setActiveUser(partner);
    setMinimized(false);
    try {
      const history = await api.getMessagesWith(partner.id);
      setMessages(Array.isArray(history) ? history : []);
      if (Number(partner.unreadCount) > 0) {
        await api.markConversationRead(partner.id);
        loadPartners();
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!activeUser || !text.trim() || sending) return;

    setSending(true);
    try {
      const sent = await api.sendDirectMessage(activeUser.id, text.trim());
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
      setText('');
      loadPartners();
    } catch (err) {
      console.error('Send DM error:', err);
    } finally {
      setSending(false);
    }
  };

  if (!openBox) {
    return (
      <Box sx={{ position: 'fixed', bottom: 20, right: 24, zIndex: 1300 }}>
        <Badge badgeContent={totalUnread} color="error">
          <IconButton
            color="primary"
            onClick={() => {
              setOpenBox(true);
              setMinimized(false);
              loadPartners();
            }}
            sx={{
              width: 54,
              height: 54,
              bgcolor: 'primary.main',
              color: '#fff',
              boxShadow: 4,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <ChatBubbleIcon />
          </IconButton>
        </Badge>
      </Box>
    );
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 24,
        width: 320,
        height: minimized ? 48 : 430,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        zIndex: 1300,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: 'primary.main',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          {activeUser && !minimized && (
            <IconButton
              size="small"
              sx={{ color: '#fff' }}
              onClick={() => {
                setActiveUser(null);
                setMessages([]);
                loadPartners();
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: 13 }}>
            {(activeUser?.fullName || activeUser?.email || 'C').charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle2" fontWeight="bold" noWrap>
            {activeUser ? activeUser.fullName || activeUser.email : 'Tin nhắn trực tiếp'}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setMinimized((v) => !v)}>
            <RemoveIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setOpenBox(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {!minimized && (
        <>
          {!activeUser ? (
            <List dense sx={{ flexGrow: 1, overflowY: 'auto', py: 0 }}>
              {partners.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Chưa có cuộc trò chuyện nào. Bạn có thể bấm nhắn tin từ danh sách tài khoản.
                  </Typography>
                </Box>
              ) : (
                partners.map((p) => (
                  <React.Fragment key={p.id}>
                    <ListItemButton onClick={() => handleOpenConversation(p)}>
                      <ListItemAvatar>
                        <Badge badgeContent={Number(p.unreadCount || 0)} color="error">
                          <Avatar sx={{ width: 34, height: 34 }}>
                            {(p.fullName || p.email || 'U').charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={p.fullName || p.email}
                        secondary={p.email}
                        primaryTypographyProps={{
                          fontWeight: Number(p.unreadCount) > 0 ? 'bold' : 'regular',
                          noWrap: true,
                        }}
                        secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                      />
                    </ListItemButton>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          ) : (
            <>
              <Box
                sx={{
                  flexGrow: 1,
                  p: 1.5,
                  overflowY: 'auto',
                  bgcolor: '#f5f7fb',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                {messages.map((m) => {
                  const isMine = Number(m.senderId) === myId;
                  return (
                    <Box
                      key={m.id}
                      sx={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '78%',
                        px: 1.4,
                        py: 0.9,
                        borderRadius: 2.5,
                        bgcolor: isMine ? 'primary.main' : '#fff',
                        color: isMine ? '#fff' : 'text.primary',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {m.content}
                      </Typography>
                    </Box>
                  );
                })}
                <div ref={bottomRef} />
              </Box>

              <Box
                component="form"
                onSubmit={handleSend}
                sx={{
                  p: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Aa"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                />
                <IconButton type="submit" color="primary" disabled={sending || !text.trim()}>
                  <SendIcon fontSize="small" />
                </IconButton>
              </Box>
            </>
          )}
        </>
      )}
    </Paper>
  );
}
