import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("name") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(localStorage.getItem("isLogin") === "true");
    const onLogin = () => {
      setIsLogin(true);
      setUserName(localStorage.getItem("name") || "");
    };
    window.addEventListener("login", onLogin);
    return () => window.removeEventListener("login", onLogin);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("isLogin");
    localStorage.removeItem("role");
    localStorage.removeItem("course");
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("id");
    setIsLogin(false);
    setUserName("");
    setMobileMenuOpen(false);
    navigate("/auth");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const roleLinks =
    role === "HEAD"
      ? [
          { to: "/head-dashboard/pending", label: "Pending" },
          { to: "/head-dashboard/head-accepted", label: "Head Accepted" },
          { to: "/head-dashboard/rejected-head", label: "Head Rejected" },
          { to: "/head-dashboard/rejected-teacher", label: "Teacher Rejected" },
          { to: "/head-dashboard/teacher-accepted", label: "Final Confirmed" },
          { to: "/auth?mode=create", label: "Create Account" },
        ]
      : role === "TEACHER"
        ? [
            { to: "/teacher-dashboard/head-accepted", label: "Head Accepted" },
            { to: "/teacher-dashboard/interview", label: "Waiting for Interview" },
            { to: "/teacher-dashboard/rejected-teacher", label: "Teacher Rejected" },
            { to: "/teacher-dashboard/teacher-accepted", label: "Final Confirmed" },
          ]
        : [];

  return (
    <>
      <div className="app-navbar">
        <div className="navbar-container">
          <h2 className="navbar-title">Admission Dashboard</h2>

          {isLogin && (
            <>
              <button
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>

              <div className="nav-links desktop-links">
                {roleLinks.map((item) => (
                  <NavLink key={item.to} to={item.to}>
                    {item.label}
                  </NavLink>
                ))}
                <span style={styles.userChip}>
                  {userName ? `Hi, ${userName}` : `Hi, ${role || "User"}`}
                </span>
                <button onClick={handleLogout}>Logout</button>
              </div>
            </>
          )}
        </div>
      </div>

      {isLogin && (
        <>
          <div
            className={`mobile-drawer-overlay ${mobileMenuOpen ? "show" : ""}`}
            onClick={closeMobileMenu}
          />

          <aside className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
            <div className="drawer-header">
              <strong>{userName ? `Hi, ${userName}` : role}</strong>
              <button onClick={closeMobileMenu} className="drawer-close" aria-label="Close menu">
                x
              </button>
            </div>

            <div className="drawer-links">
              {roleLinks.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={closeMobileMenu}>
                  {item.label}
                </NavLink>
              ))}
              <button onClick={handleLogout} className="drawer-logout">
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

const styles = {
  userChip: {
    padding: "6px 12px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.18)",
    border: "1px solid rgba(255,255,255,0.28)",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
};

export default Navbar;

