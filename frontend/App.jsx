import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
} from '@mui/material';
import * as XLSX from 'xlsx';
import theme from './theme';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutSubmitting, setLogoutSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    firstname: '',
    lastname: '',
    address: '',
    phone: '',
    isactive: true,
  });

  const loadProfiles = async (profileId = '') => {
    try {
      setLoading(true);
      setError('');

      const searchParams = new URLSearchParams();

      if (profileId) {
        searchParams.set('id', profileId);
      }

      const response = await fetch(`/api/profiles${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load profiles from Neon');
      }

      setProfiles(Array.isArray(data.profiles) ? data.profiles : []);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load profiles from Neon');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId('');
    setFormData({
      email: '',
      firstname: '',
      lastname: '',
      address: '',
      phone: '',
      isactive: true,
    });
  };

  const refreshCurrentView = () => {
    const trimmedId = searchId.trim();
    loadProfiles(trimmedId);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSearch = () => {
    const trimmedId = searchId.trim();

    if (!trimmedId) {
      setError('กรุณากรอก id ที่ต้องการค้นหา');
      return;
    }

    loadProfiles(trimmedId);
  };

  const handleClearSearch = () => {
    setSearchId('');
    loadProfiles();
  };

  const startEdit = (profile) => {
    setSuccessMessage('');
    setEditingId(String(profile.id));
    setFormData({
      email: profile.email ?? '',
      firstname: profile.firstname ?? '',
      lastname: profile.lastname ?? '',
      address: profile.address ?? '',
      phone: profile.phone ?? '',
      isactive: Boolean(profile.isactive),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      email: formData.email.trim(),
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      isactive: formData.isactive,
    };

    try {
      const response = await fetch(
        editingId ? `/api/profiles/${editingId}` : '/api/profiles',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Save failed');
      }

      setSuccessMessage(editingId ? 'อัปเดตข้อมูลเรียบร้อย' : 'เพิ่มข้อมูลเรียบร้อย');
      resetForm();
      refreshCurrentView();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId) => {
    const confirmed = window.confirm(`ต้องการลบรายการ id ${profileId} หรือไม่`);
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed');
      }

      if (String(profileId) === editingId) {
        resetForm();
      }

      setSuccessMessage('ลบข้อมูลเรียบร้อย');
      refreshCurrentView();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete profile');
      setLoading(false);
    }
  };

  const openLogoutDialog = () => {
    setLogoutDialogOpen(true);
  };

  const closeLogoutDialog = () => {
    if (!logoutSubmitting) {
      setLogoutDialogOpen(false);
    }
  };

  const handleLogout = async () => {
    setLogoutSubmitting(true);

    try {
      const userEmail = localStorage.getItem('userEmail');

      if (userEmail) {
        await fetch('/api/signout-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail }),
        });
      }

      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      navigate('/loginPage');
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
      navigate('/loginPage');
    } finally {
      setLogoutSubmitting(false);
      setLogoutDialogOpen(false);
    }
  };

  const handleExportExcel = () => {
    if (profiles.length === 0) {
      setError('ไม่มีข้อมูลสำหรับ Export');
      return;
    }

    try {
      setExporting(true);
      setError('');
      setSuccessMessage('');

      const rows = profiles.map((profile) => ({
        ID: profile.id,
        Name: `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim(),
        Email: profile.email ?? '',
        Address: profile.address ?? '',
        Phone: profile.phone ?? '',
        Active: profile.isactive ? 'Active' : 'Inactive',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 10 },
        { wch: 28 },
        { wch: 34 },
        { wch: 34 },
        { wch: 20 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');

      const dateLabel = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `neon_accounts_${dateLabel}.xlsx`);
      setSuccessMessage('Export Excel สำเร็จ');
    } catch (exportError) {
      setError(exportError.message || 'Export Excel ไม่สำเร็จ');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="neon-page">
        <Container maxWidth={false}>
          <Card className="neon-shell" sx={{ overflow: 'hidden' }}>
            {loading ? <LinearProgress /> : null}
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3.5}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: 'primary.main',
                          fontSize: '1rem',
                          fontWeight: 700,
                        }}
                      > 
                        S 
                      </Avatar> 
                      <Typography variant="h4" fontWeight={800} letterSpacing="-0.02em">
                        Neon Accounts
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      ตาราง account จาก Neon แสดงข้อมูลผู้ใช้แบบอ่านง่าย
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={`${profiles.length} records`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                    <Button variant="contained" onClick={loadProfiles} disabled={loading} sx={{ minWidth: 110 }}>
                      รีเฟรช
                    </Button>
                    <Button variant="outlined" color="error" onClick={openLogoutDialog} sx={{ minWidth: 110 }}>
                      Logout
                    </Button>
                  </Stack>
                </Stack>

                <Dialog
                  open={logoutDialogOpen}
                  onClose={closeLogoutDialog}
                  aria-labelledby="logout-confirm-title"
                  aria-describedby="logout-confirm-description"
                >
                  <DialogTitle id="logout-confirm-title">ยืนยันการออกจากระบบ</DialogTitle>
                  <DialogContent>
                    <DialogContentText id="logout-confirm-description">
                      ต้องการออกจากระบบตอนนี้ใช่หรือไม่
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={closeLogoutDialog} disabled={logoutSubmitting}>
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleLogout}
                      color="error"
                      variant="contained"
                      disabled={logoutSubmitting}
                    >
                      {logoutSubmitting ? 'กำลังออกจากระบบ...' : 'ยืนยัน'}
                    </Button>
                  </DialogActions>
                </Dialog>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <TextField
                    label="ค้นหา by id"
                    type="number"
                    value={searchId}
                    onChange={(event) => setSearchId(event.target.value)}
                    sx={{ width: { xs: '100%', sm: 1500 } }}
                  />
                  <Button variant="contained" onClick={handleSearch} disabled={loading} sx={{ minWidth: 140 }}>
                    ค้นหา
                  </Button>
                  <Button variant="outlined" onClick={handleClearSearch} disabled={loading} sx={{ minWidth: 140 }}>
                    แสดงทั้งหมด
                  </Button>
                </Stack>

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {editingId ? `แก้ไขข้อมูล id ${editingId}` : 'เพิ่มข้อมูลใหม่'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            บันทึกลงลงNeonอัตโนมัติเมื่อกดปุ่ม เพิ่มข้อมูล หรือ อัปเดตข้อมูล
                          </Typography>
                        </Box>
                        <Card
                          variant="outlined"
                          component="button"
                          type="button"
                          onClick={handleExportExcel}
                          disabled={loading || exporting || profiles.length === 0}
                          sx={{
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            px: 0,
                            cursor: loading || exporting || profiles.length === 0 ? 'not-allowed' : 'pointer',
                            opacity: loading || exporting || profiles.length === 0 ? 0.6 : 1,
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <CardContent sx={{ py: 1, px: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              {exporting ? 'กำลัง Export...' : 'Export Excel'}
                            </Typography>
                          </CardContent>
                        </Card>

                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <TextField
                          label="Firstname"
                          value={formData.firstname}
                          onChange={(event) => setFormData((prev) => ({ ...prev, firstname: event.target.value }))}
                          sx={{ width: { xs: '100%', sm: 500 } }}
                        />
                        <TextField
                          label="Lastname"
                          value={formData.lastname}
                          onChange={(event) => setFormData((prev) => ({ ...prev, lastname: event.target.value }))}
                          sx={{ width: { xs: '100%', sm: 500 } }}
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <TextField
                          label="Email"
                          value={formData.email}
                          onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                          sx={{ width: { xs: '100%', sm: 500 } }}
                        />
                        <TextField
                          label="Phone"
                          value={formData.phone}
                          onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                          sx={{ width: { xs: '100%', sm: 500 } }}
                        />
                      </Stack>

                      <TextField
                        label="Address"
                        value={formData.address}
                        onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
                        sx={{ width: { xs: '100%', sm: 500 } }}
                      />

                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isactive}
                            onChange={(event) => setFormData((prev) => ({ ...prev, isactive: event.target.checked }))}
                          />
                        }
                        label="Active"
                      />

                      <Stack direction="row" spacing={1.5}>
                        <Button type="submit" variant="contained" disabled={loading}>
                          {editingId ? 'อัปเดตข้อมูล' : 'เพิ่มข้อมูล'}
                        </Button>
                        <Button type="button" variant="outlined" onClick={resetForm} disabled={loading}>
                          ล้างฟอร์ม
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {error ? <Alert severity="error">{error}</Alert> : null}
                {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

                <TableContainer
                  component={Paper}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Table size="small" stickyHeader aria-label="neon accounts table">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell align="center">Active</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profiles.length > 0 ? (
                        profiles.map((profile) => {
                          const fullName = `${profile.firstname ?? ''} ${profile.lastname ?? ''}`.trim();

                          return (
                            <TableRow key={profile.id} hover>
                              <TableCell>{profile.id}</TableCell>
                              <TableCell>
                                <Stack spacing={0.4}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {fullName || 'Unnamed profile'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {profile.firstname || '-'} / {profile.lastname || '-'}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>{profile.email || '-'}</TableCell>
                              <TableCell>{profile.address || '-'}</TableCell>
                              <TableCell>{profile.phone || '-'}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={profile.isactive ? 'Active' : 'Inactive'}
                                  color={profile.isactive ? 'success' : 'default'}
                                  size="small"
                                  variant={profile.isactive ? 'filled' : 'outlined'}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Button size="small" variant="outlined" onClick={() => startEdit(profile)}>
                                    แก้ไข
                                  </Button>
                                  <Button
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => handleDelete(profile.id)}
                                    disabled={!profile.isactive}
                                  >
                                    ลบ
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        !loading && (
                          <TableRow>
                            <TableCell colSpan={7}>
                              <Box sx={{ py: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  No accounts found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  ตาราง account ยังไม่มีข้อมูล
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
