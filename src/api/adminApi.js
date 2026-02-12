import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL ||     'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Attach token automatically
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =============== VOLUNTEER ROLES ===============
export const getRoles = () => adminApi.get('/admin/roles');
export const createRole = (data) => adminApi.post('/admin/roles', data);
export const updateRole = (id, data) => adminApi.put(`/admin/roles/${id}`, data);
export const deleteRole = (id) => adminApi.delete(`/admin/roles/${id}`);

// =============== VOLUNTEER APPLICATIONS ===============
export const getApplications = () => adminApi.get('/admin/applications');
export const approveApplication = (id) => adminApi.put(`/admin/applications/${id}/approve`);

// =============== SCHEDULES ===============
export const getSchedules = () => adminApi.get('/admin/schedules');
export const createSchedule = (data) => adminApi.post('/admin/schedules', data);
export const updateSchedule = (id, data) => adminApi.put(`/admin/schedules/${id}`, data);
export const deleteSchedule = (id) => adminApi.delete(`/admin/schedules/${id}`);
export const getRoleSchedules = (roleId) => adminApi.get(`/admin/roles/${roleId}/schedules`);
export const getVolunteerSchedules = (userId) => adminApi.get(`/admin/volunteers/${userId}/schedules`);

// =============== ANNOUNCEMENTS ===============
export const getAnnouncements = () => adminApi.get('/admin/announcements');
export const createAnnouncement = (data) => adminApi.post('/admin/announcements', data);
export const updateAnnouncement = (id, data) => adminApi.put(`/admin/announcements/${id}`, data);
export const deleteAnnouncement = (id) => adminApi.delete(`/admin/announcements/${id}`);
export const assignVolunteersToAnnouncement = (id, volunteers) => 
  adminApi.post(`/admin/announcements/${id}/assign-volunteers`, { volunteers });

// =============== DISCUSSION GROUPS ===============
export const getGroups = () => adminApi.get('/admin/groups');
export const createGroup = (data) => adminApi.post('/admin/groups', data);
export const updateGroup = (id, data) => adminApi.put(`/admin/groups/${id}`, data);
export const deleteGroup = (id) => adminApi.delete(`/admin/groups/${id}`);
export const addGroupMembers = (id, members) => adminApi.post(`/admin/groups/${id}/add-members`, { members });
export const removeGroupMembers = (id, members) => adminApi.delete(`/admin/groups/${id}/members`, { data: { members } });
export const deleteGroupPost = (groupId, postId) => adminApi.delete(`/admin/groups/${groupId}/posts/${postId}`);

// =============== ATTENDANCE & REPORTS ===============
export const logAttendance = (data) => adminApi.post('/admin/attendance', data);
export const getAllAttendance = () => adminApi.get('/admin/attendance');
export const getVolunteerAttendance = (userId) => adminApi.get(`/admin/volunteers/${userId}/attendance`);
export const getAvailabilityReport = () => adminApi.get('/admin/volunteers/availability-report');
export const getHoursSummary = () => adminApi.get('/admin/hours-summary');

export default adminApi;
