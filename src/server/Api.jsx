import axios from "axios";

/* ================= AXIOS INSTANCE ================= */

const API = axios.create({
  baseURL: "http://localhost:5550/admission", // backend admission routes
});

/* ================= JWT TOKEN INTERCEPTOR ================= */

API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem("token"); // token stored after login
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

/* ================= FETCH STUDENTS ================= */

// Pending (HEAD only)
export const getPendingStudents = () => API.get("/submitted");

// Head approved list (HEAD only)
export const getHeadAcceptedStudents = () => API.get("/head-accepted");

// Head rejected list (HEAD only)
export const getHeadRejectedStudents = () => API.get("/head-rejected");

// Teacher selected candidates
export const getTeacherAcceptedStudents = () => API.get("/teacher-accepted");

// Teacher head-approved candidates (only pending final workflow)
export const getTeacherHeadAcceptedStudents = () => API.get("/teacher-head-accepted");

// Teacher rejected candidates
export const getTeacherRejectedStudents = () => API.get("/teacher-rejected");

// Students needing interview scheduling (HEAD + TEACHER)
export const getInterviewRequiredStudents = () => API.get("/interview_required");

// Dashboard data (HEAD sees all, TEACHER sees only HEAD_ACCEPTED for their course)
export const getDashboardData = () => API.get("/get-data");

/* ================= HEAD ACTIONS ================= */

// Approve student (HEAD only)
export const headApproveStudent = (id) => API.put(`/head/approve/${id}`);

// Reject student (HEAD only)
export const headRejectStudent = (id) => API.put(`/head/reject/${id}`);

/* ================= TEACHER ACTIONS ================= */

// Schedule interview (TEACHER only)
export const scheduleInterview = (id, interviewData) =>
  API.post(`/schedule-interview/${id}`, interviewData);

// Final approve (TEACHER only)
export const teacherApproveStudent = (id) => API.put(`/final/approve/${id}`);

// Final reject (TEACHER only)
export const teacherRejectStudent = (id) => API.put(`/final/reject/${id}`);

/* ================= EXPORT ================= */

export default API;
