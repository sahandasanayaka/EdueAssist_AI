import api from './api';

export const studentApi = {
  getDashboard: async () => {
    const response = await api.get('/students/dashboard');
    return response.data;
  },

  getAcademicAnalysis: async () => {
    const response = await api.get('/students/academic-analysis');
    return response.data;
  },

  getCourses: async () => {
    const response = await api.get('/students/courses');
    return response.data;
  },

  getAttendance: async () => {
    const response = await api.get('/students/attendance');
    return response.data;
  },

  getAssignments: async () => {
    const response = await api.get('/students/assignments');
    return response.data;
  },

  getAssignment: async (assignmentId) => {
    const response = await api.get(`/students/assignments/${assignmentId}`);
    return response.data;
  },

  submitAssignment: async (assignmentId, data = {}) => {
    const response = await api.post(`/students/assignments/${assignmentId}/submit`, data);
    return response.data;
  },

  getGrowth: async () => {
    const response = await api.get('/students/growth');
    return response.data;
  },

  getStudyPlan: async () => {
    const response = await api.get('/students/study-plan');
    return response.data;
  },

  generateStudyPlan: async (preferences = {}) => {
    const response = await api.post('/students/study-plan/generate', preferences);
    return response.data;
  },

  toggleStudyPlanTask: async (taskId) => {
    const response = await api.patch(`/students/study-plan/${taskId}/toggle`);
    return response.data;
  },

  deleteStudyPlanTask: async (taskId) => {
    const response = await api.delete(`/students/study-plan/${taskId}`);
    return response.data;
  },

  getCareerPaths: async () => {
    const response = await api.get('/students/career-paths');
    return response.data;
  },

  getCareerHub: async () => {
    const response = await api.get('/students/career-hub');
    return response.data;
  },

  updateCareerGoal: async (goalData) => {
    const response = await api.put('/students/career-goal', goalData);
    return response.data;
  },

  getResources: async () => {
    const response = await api.get('/students/resources');
    return response.data;
  },

  chat: async (message, sessionId = 'default') => {
    const response = await api.post('/students/chat', { message, session_id: sessionId });
    return response.data;
  },

  getChatHistory: async (sessionId = null) => {
    const response = await api.get('/students/chat/history', {
      params: sessionId ? { session_id: sessionId } : {}
    });
    return response.data;
  }
};

export default studentApi;
