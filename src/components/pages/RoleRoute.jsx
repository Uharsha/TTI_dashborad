import { Navigate } from "react-router-dom";

const RoleRoute = ({ allowedRoles, children }) => {
  const isLogin = localStorage.getItem("isLogin");
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const normalizedAllowedRoles = allowedRoles.map((allowedRole) =>
    (allowedRole || "").toUpperCase()
  );

  if (isLogin !== "true") {
    return <Navigate to="/auth" replace />;
  }

  if (!normalizedAllowedRoles.includes(role)) {
    if (role === "HEAD") return <Navigate to="/head-dashboard/pending" replace />;
    if (role === "TEACHER") return <Navigate to="/teacher-dashboard/head-accepted" replace />;
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default RoleRoute;
