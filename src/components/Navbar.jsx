import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../server/Api";

function Navbar() {
  const [isLogin, setIsLogin] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem("name") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const notificationRef = useRef(null);
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

  useEffect(() => {
    if (!isLogin) return undefined;
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const res = await getNotifications();
        if (!mounted) return;
        setNotifications(res?.data?.notifications || []);
        setUnreadCount(res?.data?.unreadCount || 0);
      } catch {
        if (!mounted) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [isLogin]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const closePanel = (event) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", closePanel);
    return () => document.removeEventListener("mousedown", closePanel);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

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

  const handleOpenNotifications = () => {
    setNotificationOpen((prev) => !prev);
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const roleLinks =
    role === "HEAD"
      ? [
          { to: "/head-dashboard/pending", label: "Pending" },
          { to: "/head-dashboard/head-accepted", label: "Head Accepted" },
          { to: "/head-dashboard/rejected-head", label: "Head Rejected" },
          { to: "/head-dashboard/rejected-teacher", label: "Teacher Rejected" },
          { to: "/head-dashboard/teacher-accepted", label: "Final Confirmed" },
          { to: "/head-dashboard/interview-calendar", label: "Interview Calendar" },
          { to: "/head-dashboard/notifications", label: "Notifications" },
          { to: "/head-dashboard/audit-logs", label: "Audit Logs" },
          { to: "/auth?mode=create", label: "Create Account" },
        ]
      : role === "TEACHER"
        ? [
            { to: "/teacher-dashboard/head-accepted", label: "Head Accepted" },
            { to: "/teacher-dashboard/interview", label: "Waiting for Interview" },
            { to: "/teacher-dashboard/rejected-teacher", label: "Teacher Rejected" },
            { to: "/teacher-dashboard/teacher-accepted", label: "Final Confirmed" },
            { to: "/teacher-dashboard/interview-calendar", label: "Interview Calendar" },
            { to: "/teacher-dashboard/notifications", label: "Notifications" },
            { to: "/teacher-dashboard/audit-logs", label: "Audit Logs" },
          ]
        : [];

  return (
    <>
      <div className="app-navbar">
        <div className="navbar-container" role="navigation" aria-label="Primary">
          <h2 className="navbar-title">Admission Dashboard</h2>

          {isLogin && (
            <>
              <button
                type="button"
                className="hamburger-btn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu-drawer"
              >
                <span className="hamburger-lines" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>

              <div className="nav-links desktop-links">
                <div className="desktop-link-scroll">
                  {roleLinks.map((item) => (
                    <NavLink key={item.to} to={item.to}>
                      {item.label}
                    </NavLink>
                  ))}
                </div>
                <div className="notification-wrap" ref={notificationRef}>
                  <button
                    type="button"
                    className="notification-btn"
                    onClick={handleOpenNotifications}
                    aria-label="Notifications"
                    aria-expanded={notificationOpen}
                    aria-controls="notification-panel"
                  >
                    Alerts
                    {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </button>
                  {notificationOpen && (
                    <div className="notification-panel" id="notification-panel" role="dialog" aria-label="Notification panel">
                      <div className="notification-head">
                        <strong>Notifications</strong>
                        <button type="button" onClick={handleReadAll} className="notification-readall">Mark all</button>
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 && <p className="notification-empty">No notifications</p>}
                        {notifications.map((note) => (
                          <button
                            key={note._id}
                            className={`notification-item ${note.isRead ? "read" : "unread"}`}
                            onClick={() => handleRead(note._id)}
                            type="button"
                          >
                            <span className="notification-title">{note.title}</span>
                            <span className="notification-msg">{note.message}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span style={styles.userChip}>
                  {userName ? `Hi, ${userName}` : `Hi, ${role || "User"}`}
                </span>
                <button
                  type="button"
                  onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? "Dark" : "Light"}
                </button>
                <button type="button" onClick={handleLogout}>Logout</button>
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

          <aside className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`} id="mobile-menu-drawer" aria-label="Mobile menu">
            <div className="drawer-header">
              <strong>{userName ? `Hi, ${userName}` : role}</strong>
              <button type="button" onClick={closeMobileMenu} className="drawer-close" aria-label="Close menu">
                x
              </button>
            </div>

            <div className="drawer-links">
              {roleLinks.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={closeMobileMenu}>
                  {item.label}
                </NavLink>
              ))}
              <button type="button" onClick={handleLogout} className="drawer-logout">
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

