import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  // 1. QUY CHUẨN MÀU SẮC (Palette)
  palette: {
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#222c41',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: { main: '#2e7d32', light: '#e8f5e9' },
    error: { main: '#d32f2f', light: '#ffebee' },
    warning: { main: '#ed6c02', light: '#fff3e0' },
    info: { main: '#0288d1', light: '#e1f5fe' },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
  },

  // 2. QUY CHUẨN FONT CHỮ (Typography)
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600, fontSize: '1.1rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  //(Components Override)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme;
