import axios from 'axios';

const API = axios.create({
  baseURL: 'https://church.altoservices.net/api',
});

// Attach tokená
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle auth failure
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// MEMBERS
API.getMembers = () => API.get('/members');
API.createMember = (data) => API.post('/members', data);
API.updateMember = (id, data) => API.put(`/members/${id}`, data);
API.deleteMember = (id) => API.delete(`/members/${id}`);

// DONATIONS
API.getDonations = () => API.get('/pay');
API.createDonation = (data) => API.post('/pay', data);

// WORKERS
API.getWorkers = () => API.get('/workers');
API.createWorker = (data) => API.post('/workers', data);
API.updateWorker = (id, data) => API.put(`/workers/${id}`, data);
API.deleteWorker = (id) => API.delete(`/workers/${id}`);

// EVENTS
export const getEvents = () => API.get('/event');
export const createEvent = (formData) => API.post('/event', formData); // <-- no headers
export const deleteEvent = (id) => API.delete(`/event/${id}`);

// SERMONS
API.getSermons = () => API.get('/audio');
API.createSermon = (data) => API.post('/audio', data);
API.updateSermon = (id, data) => API.put(`/audio/${id}`, data);
API.deleteSermon = (id) => API.delete(`/audio/${id}`);

// Blogs
API.getBlogs = () => API.get('/blogs');
API.createBlog = (data) => API.post('/blogs', data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
API.updateBlog = (id, data) => API.put(`/blog/${id}`, data, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
API.deleteBlog = (id) => API.delete(`/blog/${id}`);
// RECORDS
API.getRecords = () => API.get('/records');

export default API;
