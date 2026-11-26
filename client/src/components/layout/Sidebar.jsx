import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Toolbar,
  Typography,
  Chip,
} from '@mui/material';
import { useSocket } from '../../context/SocketContext.jsx';

const drawerWidth = 260;

export default function Sidebar({ items, current, open, onSelect, onClose }) {
  const { unreadCount } = useSocket();

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ justifyContent: 'center', borderBottom: '1px solid #f0f0f0', mb: 2 }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          color="primary.main"
          onClick={() => {
            const targetKey = items.some((i) => i.key === 'dashboard') ? 'dashboard' : items[0]?.key || 'games';
            onSelect(targetKey);
          }}
          sx={{
            letterSpacing: 1,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'opacity 0.2s',
            '&:hover': { opacity: 0.75 },
          }}
        >
          GAME CATALOG
        </Typography>
      </Toolbar>

      <List sx={{ px: 2, flexGrow: 1 }}>
        {items.map((item) => {
          const isActive = item.key === current;
          const showUnreadBadge = item.key === 'inbox' && unreadCount > 0;

          return (
            <ListItem key={item.key} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => onSelect(item.key)}
                sx={{
                  borderRadius: 2,
                  ...(isActive && {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { bgcolor: 'primary.dark' },
                  }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'inherit' : 'text.secondary',
                    minWidth: 40,
                    fontSize: '1.2rem',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: isActive ? 600 : 500 }} />
                {showUnreadBadge && (
                  <Chip
                    label={unreadCount > 99 ? '99+' : unreadCount}
                    size="small"
                    color={isActive ? 'default' : 'error'}
                    sx={{
                      height: 20,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      ...(isActive && {
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                      }),
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: 'none',
            boxShadow: 3,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid #e0e0e0',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
