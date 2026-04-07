import { apiRequest } from "./queryClient";

export const api = {
  auth: {
    login: (data: any) => apiRequest('POST', '/api/auth/login', data),
    verifyEmail: (data: any) => apiRequest('POST', '/api/auth/verify-email', data),
    resendOTP: (data: any) => apiRequest('POST', '/api/auth/resend-otp', data),
    me: () => apiRequest('GET', '/api/auth/me'),
  },
  
  user: {
    updateProfile: (data: any) => apiRequest('PUT', '/api/user/profile', data),
    sendPasswordResetOTP: () => apiRequest('POST', '/api/user/password-reset-otp'),
    changePassword: (data: any) => apiRequest('POST', '/api/user/change-password', data),
  },
  
    student: {
      getAssignments: () => apiRequest('GET', '/api/student/assignments'),
      getAssignment: (id: string) => apiRequest('GET', `/api/student/assignment/${id}`),
      runCode: (data: any) => apiRequest('POST', '/api/student/run', data),
      submitCode: (data: any) => apiRequest('POST', '/api/student/submit', data),
      autoSaveCode: (data: any) => apiRequest('POST', '/api/student/auto-save', data),
      saveDraft: (data: any) => apiRequest('POST', '/api/student/save-draft', data),
      getDraft: (questionId: string) => apiRequest('GET', `/api/student/draft/${questionId}`),
      getEditorState: (questionId: string) => apiRequest('GET', `/api/student/editor-state/${questionId}`),
      getSubmission: (questionId: string) => apiRequest('GET', `/api/student/submissions/${questionId}`),
      getMySubmissions: () => apiRequest('GET', '/api/student/my-submissions'),
    },
    
    admin: {
      getQuestions: () => apiRequest('GET', '/api/admin/questions'),
      createQuestion: (data: any) => apiRequest('POST', '/api/admin/question', data),
      updateQuestion: (id: string, data: any) => apiRequest('PUT', `/api/admin/question/${id}`, data),
      deleteQuestion: (id: string) => apiRequest('DELETE', `/api/admin/question/${id}`),
      getSubmissions: (questionId: string) => apiRequest('GET', `/api/admin/submissions/${questionId}`),
      getDashboardStats: () => apiRequest('GET', '/api/admin/dashboard/stats'),
      getAllStudents: () => apiRequest('GET', '/api/admin/students'),
      getStudent: (id: string) => apiRequest('GET', `/api/admin/student/${id}`),
      getStudentSubmissions: (id: string) => apiRequest('GET', `/api/admin/student-submissions/${id}`),
      getAllSubmissions: () => apiRequest('GET', '/api/admin/all-submissions'),
      getQuestion: (id: string) => apiRequest('GET', `/api/admin/question/${id}`),
      generateStudentPDF: (id: string) => apiRequest('POST', `/api/admin/student-pdf/${id}`),
      generateStudentsExcel: () => apiRequest('POST', '/api/admin/students-excel'),
      getAnalytics: (range: string) => apiRequest('GET', `/api/admin/analytics?range=${range}`)
    },
};
