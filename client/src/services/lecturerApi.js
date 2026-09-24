import api from './api';

export const lecturerApi = {
  getDashboard: async () => {
    const response = await api.get('/lecturers/dashboard');
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/lecturers/courses');
    return response.data;
  },

  getCourseDetail: async (courseCode) => {
    const response = await api.get(`/lecturers/courses/${courseCode}`);
    return response.data;
  },

  getCourseStudents: async (courseCode) => {
    const response = await api.get(`/lecturers/courses/${courseCode}/students`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/lecturers/analytics');
    return response.data;
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const response = await api.get(`/lecturers/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  gradeSubmission: async (submissionId, data) => {
    const response = await api.patch(`/lecturers/submissions/${submissionId}`, data);
    return response.data;
  }
};

export default lecturerApi;
