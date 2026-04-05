import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#9b5050', // rose pastel 
      light: '#ffffff',
      dark: '#903232', // เมื่อเอาเม้าส์ไปเลือกปุ่ม
      contrastText: '#fff',
    },
    secondary: {
      main: '#9b5050', // soft slate blue
      light: '#903232',
      dark: '#903232',
      contrastText: '#fff',
    },
    success: {
      main: '#8fc9ae',
      light: '#c8e7d8',
      dark: '#6fa98e',
    },
    error: {
      main: '#ff0000',
      light: '#ff0000',
      dark: '#ff0000',
    },
    warning: {
      main: '#ff0000',
      light: '#ff0000',
      dark: '#ff0000',
    },
    info: {
      main: '#9dbfe2',
      light: '#d5e3f3',
      dark: '#7ea3c8',
    },
    background: {
      default: '#faf8f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
    divider: '#ffffff',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
    },
    body1: {
      fontWeight: 500,
    },
    body2: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 6px 14px rgba(121, 105, 95, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 14px 28px -14px rgba(135, 117, 106, 0.28)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          color: '#2a2421',
          backgroundColor: '#f2efe9',
        },
        body: {
          color: '#2f2b2a',
          fontWeight: 500,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#1f1b1a',
        },
      },
    },
  },
});

export default theme;
