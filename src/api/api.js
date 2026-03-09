import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'https://lizzy.altoservices.org/api';

const API = axios.create({
  baseURL: BASE_URL,
});

const getStoredToken = () => (
  localStorage.getItem('admin_token')
  || localStorage.getItem('token')
  || localStorage.getItem('user_token')
  || ''
);

API.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export const adminLogin = (data) => API.post('/admin/login', data);
export const getUsers = () => API.get('/admin/users');

/* EVENTS */
export const getEvents = () => API.get('/admin/event');
export const createEvent = (data) => API.post('/admin/event', data);
export const updateEvent = (id, data) => API.put(`/admin/event/${id}`, data);
export const deleteEvent = (id) => API.delete(`/admin/event/${id}`);

/* VOLUNTEER */
export const getAnnouncements = () => API.get('/volunteer/announcements');
export const getSchedules = () => API.get('/volunteer/schedule/get.php');
export const getDiscussions = () => API.get('/volunteer/discussion/get.php');

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

API.login = (data) => API.post('/login', data);
API.register = (data) => API.post('/register', data);
API.logout = () => API.post('/logout');
API.profile = () => API.get('/profile');

API.getVolunteerRoles = () => API.get('/volunteer/roles');

API.createVolunteerRole = (data) => API.post('/roles', data); // admin only

API.updateVolunteerRole = (id, data) => API.put(`/roles/${id}`, data);

API.deleteVolunteerRole = (id) => API.delete(`/roles/${id}`);

API.applyForVolunteerRole = (roleId) => API.post(`/volunteer/apply/${roleId}`);

API.getMySchedule = () => API.get('/my-schedule');

API.getMyAnnouncements = () => API.get('/volunteer/announcements');

API.createAnnouncement = (data) => API.post('/announcements', data); // admin

API.getVolunteerGroups = () => API.get('/volunteer/groups');

API.getGroupPosts = (groupId) => API.get(`/volunteer/groups/${groupId}/posts`);

API.createGroupPost = (groupId, data) => API.post(`/volunteer/groups/${groupId}/posts`, data);

API.getMyHoursWorked = () => API.get('/volunteer/hours-worked');

API.submitAvailability = (data) => API.post('/availability/hours-worked', data);

/* SCHEDULE */
API.getSchedules = () => API.get('/schedules');
API.createSchedule = (data) => API.post('/schedules', data); // admin

API.getMembers = () => API.get('/members');
API.createMember = (data) => API.post('/members', data);
API.updateMember = (id, data) => API.put(`/members/${id}`, data);
API.deleteMember = (id) => API.delete(`/members/${id}`);

API.getEvents = () => API.get('/event');
API.createEvent = (data) => API.post('/event', data);
API.deleteEvent = (id) => API.delete(`/event/${id}`);

API.getSermons = () => API.get('/audio');
API.createSermon = (data) => API.post('/audio', data);
API.updateSermon = (id, data) => API.put(`/audio/${id}`, data);
API.deleteSermon = (id) => API.delete(`/audio/${id}`);

API.getBlogs = () => API.get('/blogs');

API.createBlog = (data) => API.post('/blogs', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

API.updateBlog = (id, data) => API.put(`/blog/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

API.deleteBlog = (id) => API.delete(`/blog/${id}`);

API.getWhatsAppLinks = () => API.get('/whatsapp-links');

export default API;
