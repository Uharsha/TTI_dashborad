// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Navbar from "./components/Navbar";

// import Pending from "./components/pages/Pending";
// import HeadAccepted from "./components/pages/HeadAccepted";
// import TeacherAccepted from "./components/pages/TeacherAccepted";
// import RejectedHead from "./components/pages/RejectedHead";
// import RejectedTeacher from "./components/pages/RejectedTeacher";
// import MoreData from "./components/pages/view/MoreData";
// import Interview from "./components/pages/Interview";
// import WaitingInterview from "./components/pages/Waiting";
// import AuthDashboard from "./components/pages/AuthDashboard";

// // import ProtectedRoute from "./components/pages/ProtectedRoute";
// // import RoleRoute from "./components/pages/RoleRoute";

// function App() {
//   return (
//     <BrowserRouter>
//       <Navbar />

//       <Routes>
//         <Route path="/" element={<AuthDashboard />} />
//         <Route path="/auth" element={<AuthDashboard />} />
//         <Route path="/pending" element={<Pending />} />
//         <Route path="/head-accepted" element={<HeadAccepted />} />
//         <Route path="/rejected-head" element={<RejectedHead />} />
//         <Route path="/teacher-accepted" element={<TeacherAccepted />} />
//         <Route path="/rejected-teacher" element={<RejectedTeacher />} />
//         <Route path="/interview" element={<WaitingInterview />} />
//         <Route path="/student_data/:id" element={<MoreData />} />
//         <Route path="/interview/details/:id" element={<Interview />} />
   
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import RoleRoute from "./components/pages/RoleRoute";

// import Pending from "./components/pages/Pending";
// import HeadAccepted from "./components/pages/HeadAccepted";
// import TeacherAccepted from "./components/pages/TeacherAccepted";
// import RejectedHead from "./components/pages/RejectedHead";
// import RejectedTeacher from "./components/pages/RejectedTeacher";
// import MoreData from "./components/pages/view/MoreData";
// import Interview from "./components/pages/Interview";
// import WaitingInterview from "./components/pages/Waiting";
import AuthDashboard from "./components/pages/AuthDashboard";
import Head from "./components/pages/Head";
import Teacher from "./components/pages/Teacher";

function HeadAcceptedRedirect() {
  const role = (localStorage.getItem("role") || "").toUpperCase();

  if (role === "TEACHER") {
    return <Navigate to="/teacher-dashboard/head-accepted" replace />;
  }

  return <Navigate to="/head-dashboard/head-accepted" replace />;
}

function TeacherAcceptedRedirect() {
  const role = (localStorage.getItem("role") || "").toUpperCase();

  if (role === "HEAD") {
    return <Navigate to="/head-dashboard/teacher-accepted" replace />;
  }

  return <Navigate to="/teacher-dashboard/teacher-accepted" replace />;
}

function RejectedTeacherRedirect() {
  const role = (localStorage.getItem("role") || "").toUpperCase();

  if (role === "HEAD") {
    return <Navigate to="/head-dashboard/rejected-teacher" replace />;
  }

  return <Navigate to="/teacher-dashboard/rejected-teacher" replace />;
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/" || location.pathname === "/auth";

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {!hideNavbar && <Navbar />}
      <main id="main-content" tabIndex="-1">
        <Routes>
          <Route path="/" element={<AuthDashboard />} />
          <Route path="/auth" element={<AuthDashboard />} />
          <Route
            path="/head-dashboard/*"
            element={
              <RoleRoute allowedRoles={["HEAD"]}>
                <Head />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher-dashboard/*"
            element={
              <RoleRoute allowedRoles={["TEACHER"]}>
                <Teacher />
              </RoleRoute>
            }
          />
          <Route path="/pending" element={<Navigate to="/head-dashboard/pending" replace />} />
          <Route path="/head-accepted" element={<HeadAcceptedRedirect />} />
          <Route path="/rejected-head" element={<Navigate to="/head-dashboard/rejected-head" replace />} />
          <Route path="/head-rejected" element={<Navigate to="/head-dashboard/head-rejected" replace />} />
          <Route path="/interview" element={<Navigate to="/teacher-dashboard/interview" replace />} />
          <Route path="/teacher-accepted" element={<TeacherAcceptedRedirect />} />
          <Route path="/rejected-teacher" element={<RejectedTeacherRedirect />} />
          <Route path="/interview/details/:id" element={<Navigate to="/teacher-dashboard/interview" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
