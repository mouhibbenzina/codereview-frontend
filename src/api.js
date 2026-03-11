import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Classes
export const createClass = (data) => API.post('/classes', data);
export const getMyClasses = () => API.get('/classes/mine');
export const joinClass = (inviteCode) => API.post('/classes/join', { inviteCode });
export const getEnrolledClasses = () => API.get('/classes/enrolled');

// Assignments
export const createAssignment = (classId, data) => API.post(`/classes/${classId}/assignments`, data);
export const getAssignments = (classId) => API.get(`/classes/${classId}/assignments`);

// Submissions
export const submitCode = (assignmentId, code) => API.post(`/assignments/${assignmentId}/submit`, { code });
export const getSubmission = (id) => API.get(`/submissions/${id}`);
export const getSubmissions = (assignmentId) => API.get(`/assignments/${assignmentId}/submissions`);
export const getMySubmissions = () => API.get('/my-submissions');
export const gradeSubmission = (id, data) => API.post(`/submissions/${id}/grade`, data);

// Comments
export const getComments = (subId) => API.get(`/submissions/${subId}/comments`);
export const postComment = (subId, data) => API.post(`/submissions/${subId}/comments`, data);

export default API;
