import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../ui/ToastContext";

const courseOptions = [
  { label: "MachineLearning", value: "MachineLearning" },
  { label: "DBMS", value: "DBMS" },
  { label: "CloudComputing", value: "CloudComputing" },
  { label: "Accessibility", value: "Accessibility" },
  { label: "BasicComputers", value: "BasicComputers" },
];

const AuthDashboard = () => {
  const API_BASE = (process.env.REACT_APP_API_BASE || "https://tti-dashborad.onrender.com").replace(/\/+$/, "");
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const isResetMode = searchParams.get("mode") === "reset";
  const resetToken = searchParams.get("token") || "";

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "TEACHER",
    course: "",
  });

  const isAuthenticated = localStorage.getItem("isLogin") === "true";
  const currentRole = (localStorage.getItem("role") || "").toUpperCase();
  const isHeadUser = isAuthenticated && currentRole === "HEAD";
  const createMode = searchParams.get("mode") === "create" && isHeadUser;
  const showRegister = createMode;
  const requireCourse = showRegister && formData.role === "TEACHER";

  useEffect(() => {
    if (isResetMode) return;
    // Keep auth page as default landing page on app open.
  }, [isResetMode]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill both password fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          password: formData.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to reset password.");
        return;
      }

      toast.success("Password updated successfully. Please sign in.");
      navigate("/auth");
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch {
      toast.error("Unable to connect to server. Please try again.");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (forgotSubmitting) return;

    if (!formData.email) {
      toast.error("Please enter your email.");
      return;
    }

    try {
      setForgotSubmitting(true);
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Unable to process request.");
        return;
      }

      toast.info(result.message || "If this email exists, reset instructions were sent.");
      setForgotMode(false);
    } catch {
      toast.error("Unable to connect to server. Please try again.");
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showRegister && !formData.name) {
      toast.error("Please enter full name.");
      return;
    }

    if (showRegister && requireCourse && !formData.course) {
      toast.error("Please select a course.");
      return;
    }

    const url = `${API_BASE}/api/auth/${showRegister ? "register" : "login"}`;
    const payload = showRegister
      ? {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          course: formData.role === "TEACHER" ? formData.course : "",
        }
      : { email: formData.email, password: formData.password };

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || result.msg || "Request failed.");
        return;
      }

      // When HEAD creates another account, keep current session unchanged.
      if (showRegister && isHeadUser) {
        toast.success(`${formData.role} account created successfully.`);
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "TEACHER",
          course: "",
        });
        return;
      }

      const loggedInUser = result.user || {};
      const role = (loggedInUser.role || result.role || "").toUpperCase();
      const course = loggedInUser.course || result.course || "";
      const name = loggedInUser.name || result.name || "";
      const id = loggedInUser.id || loggedInUser._id || result.id || "";

      localStorage.setItem("isLogin", "true");
      if (role) localStorage.setItem("role", role);
      if (course) localStorage.setItem("course", course);
      else localStorage.removeItem("course");
      if (name) localStorage.setItem("name", name);
      if (id) localStorage.setItem("id", id);
      if (result.token) localStorage.setItem("token", result.token);

      window.dispatchEvent(new Event("login"));

      if (role === "HEAD") navigate("/head-dashboard/pending");
      else if (role === "TEACHER") navigate("/teacher-dashboard/head-accepted");
      else {
        localStorage.clear();
        toast.error("Role is missing in login response.");
      }
    } catch {
      toast.error("Unable to connect to server. Please try again.");
    }
  };

  if (isResetMode) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>Set a new password for your account.</p>
          <form onSubmit={handleResetPassword} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>New Password</label>
              <input
                style={styles.input}
                name="password"
                type="password"
                placeholder="Enter new password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                style={styles.input}
                name="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <button type="submit" style={styles.submitBtn}>Update Password</button>
          </form>
        </div>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h2 style={styles.title}>Forgot Password</h2>
          <p style={styles.subtitle}>Enter your account email to get reset link.</p>
          <form onSubmit={handleForgotPassword} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email Address</label>
              <input
                style={styles.input}
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                ...(forgotSubmitting ? styles.submitBtnDisabled : {}),
              }}
              disabled={forgotSubmitting}
            >
              {forgotSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <div style={styles.toggleSection}>
            <button type="button" onClick={() => setForgotMode(false)} style={styles.toggleBtn}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>{showRegister ? "Create Account" : "Sign In"}</h2>
        <p style={styles.subtitle}>
          {showRegister
            ? "Create HEAD or TEACHER accounts from here."
            : "Role-based access for Head and Teacher dashboards."}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {showRegister && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              name="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          {showRegister && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Role</label>
              <select
                style={{ ...styles.input, cursor: "pointer" }}
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="TEACHER">TEACHER</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>
          )}

          {requireCourse && (
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Course</label>
              <select
                style={{ ...styles.input, cursor: "pointer" }}
                name="course"
                value={formData.course}
                onChange={handleChange}
              >
                <option value="">-- Choose a course --</option>
                {courseOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" style={styles.submitBtn}>
            {showRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {!showRegister && (
          <div style={styles.toggleSection}>
            <button type="button" onClick={() => setForgotMode(true)} style={styles.toggleBtn}>
              Forgot Password?
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "3rem",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
    width: "100%",
    maxWidth: "440px",
    position: "relative",
    zIndex: 10,
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "800",
    textAlign: "center",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: "0 0 0.5rem 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    textAlign: "center",
    color: "#5a6c7d",
    fontSize: "0.95rem",
    marginBottom: "2rem",
    margin: "0 0 2rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#2c3e50",
    textTransform: "capitalize",
  },
  input: {
    padding: "0.75rem 1rem",
    border: "2px solid #e1e8ed",
    borderRadius: "8px",
    outline: "none",
    fontSize: "0.95rem",
    transition: "all 0.3s ease",
    backgroundColor: "#f8fafb",
  },
  submitBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "0.875rem 1.5rem",
    borderRadius: "8px",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "1rem",
    letterSpacing: "0.5px",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
    marginTop: "0.5rem",
  },
  submitBtnDisabled: {
    opacity: 0.75,
    cursor: "not-allowed",
  },
  toggleSection: {
    marginTop: "1.25rem",
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#5a6c7d",
    display: "flex",
    justifyContent: "center",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  toggleText: {
    color: "#5a6c7d",
  },
  toggleBtn: {
    color: "#667eea",
    fontWeight: "700",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0",
    textDecoration: "none",
    transition: "all 0.3s ease",
  },
};

export default AuthDashboard;
