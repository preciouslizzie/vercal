import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);
/* EVENTS */
let baseURL;
export const getEvents = () => axios.get(`${baseURL}/events/get.php`);

export const createEvent = (data) => axios.post(`${baseURL}/events/create.php`, data);

export const deleteEvent = (id) => axios.delete(`${baseURL}/events/delete.php?id=${id}`);

/* VOLUNTEER */
let API_URL;
export const getAnnouncements = () => axios.get(`${API_URL}/volunteer/announcements`);

export const getSchedules = () => axios.get(`${API_URL}/volunteer/schedule/get.php`);

export const getDiscussions = () => axios.get(`${API_URL}/volunteer/discussion/get.php`);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
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

API.getMyAnnouncements = () => API.get('/announcements');

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

export default API;
