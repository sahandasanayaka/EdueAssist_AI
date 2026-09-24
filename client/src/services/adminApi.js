import api from './api';

export const adminApi = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/admin/courses');
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post('/admin/courses', courseData);
    return response.data;
  },

  updateCourse: async (courseCode, updateData) => {
    const response = await api.patch(`/admin/courses/${courseCode}`, updateData);
    return response.data;
  },

  deleteCourse: async (courseCode) => {
    const response = await api.delete(`/admin/courses/${courseCode}`);
    return response.data;
  },

  getEnrollments: async (params = {}) => {
    const response = await api.get('/admin/enrollments', { params });
    return response.data;
  },

  enrollStudent: async (enrollmentData) => {
    const response = await api.post('/admin/enrollments', enrollmentData);
    return response.data;
  },

  unenrollStudent: async (studentId, courseCode) => {
    const response = await api.delete(`/admin/enrollments/${studentId}/${courseCode}`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  }
};

export default adminApi;
