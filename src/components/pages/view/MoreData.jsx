import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  headApproveStudent,
  headRejectStudent,
  teacherApproveStudent,
  teacherRejectStudent,
} from "../../../server/Api";
import { useToast } from "../../ui/ToastContext";

function MoreData() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const student = state?.student;
  const role = state?.role;
  const page = state?.page;
  const safeText = (value) => String(value || "").trim();

  if (!student) {
    return (
      <main style={styles.pageWrap}>
        <section style={styles.card}>
          <h2 style={styles.title}>Student Full Details</h2>
          <p style={styles.muted}>No data found for this profile.</p>
          <button type="button" style={styles.ghostBtn} onClick={() => navigate(-1)}>
            Go Back
          </button>
        </section>
      </main>
    );
  }

  const handleHeadApprove = async () => {
    try {
      await headApproveStudent(id);
      toast.success(`${student.name} approved by HEAD`);
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Head approve failed");
    }
  };

  const handleHeadReject = async () => {
    try {
      await headRejectStudent(id);
      toast.success("Student rejected by HEAD");
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Head reject failed");
    }
  };

  const handleTeacherApprove = async () => {
    try {
      await teacherApproveStudent(id);
      toast.success("Student approved by TEACHER");
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Teacher approve failed");
    }
  };

  const handleTeacherReject = async () => {
    try {
      await teacherRejectStudent(id);
      toast.success("Student rejected by TEACHER");
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Teacher reject failed");
    }
  };

  return (
    <main style={styles.pageWrap}>
      <section style={styles.card}>
      <h2 style={styles.title}>Student Full Details</h2>

      <div style={styles.details}>
        <div style={styles.detailRow}><span style={styles.detailKey}>ID</span><span style={styles.detailValue}>{id}</span></div>
        <div style={styles.detailRow}><span style={styles.detailKey}>Name</span><span style={styles.detailValue}>{student.name}</span></div>
        <div style={styles.detailRow}>
          <span style={styles.detailKey}>Email</span>
          <a style={styles.link} href={`mailto:${safeText(student.email)}`}>{safeText(student.email)}</a>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailKey}>Mobile</span>
          <a style={styles.link} href={`tel:${safeText(student.mobile)}`}>{safeText(student.mobile)}</a>
        </div>
        <div style={styles.detailRow}><span style={styles.detailKey}>Status</span><span style={styles.detailValue}>{student.status}</span></div>
        <div style={styles.detailRow}><span style={styles.detailKey}>NVDA Knowledge</span><span style={styles.detailValue}>{student.ScreenReader || "N/A"}</span></div>
      </div>

      {role === "HEAD" && page === "PENDING" && (
        <div style={styles.buttonRow}>
          <button type="button" style={styles.primaryBtn} onClick={handleHeadApprove}>Head Approve</button>
          {"  "}
          <button type="button" style={styles.dangerBtn} onClick={handleHeadReject}>Head Reject</button>
        </div>
      )}

      {role === "TEACHER" && page === "HEAD_ACCEPTED" && (
        <div style={styles.buttonRow}>
          <button type="button" style={styles.primaryBtn} onClick={handleTeacherApprove}>Teacher Approve</button>
          {"  "}
          <button type="button" style={styles.dangerBtn} onClick={handleTeacherReject}>Teacher Reject</button>
        </div>
      )}
      </section>
    </main>
  );
}

export default MoreData;

const styles = {
  pageWrap: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "100px 16px 24px",
    background: "var(--bg-page)",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    background: "var(--surface-card)",
    color: "var(--text-main)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    padding: "24px",
  },
  title: {
    textAlign: "center",
    margin: 0,
    color: "var(--text-main)",
  },
  muted: {
    color: "var(--text-muted)",
    marginTop: "10px",
    marginBottom: "16px",
  },
  details: {
    marginTop: "20px",
    display: "grid",
    gap: "10px",
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "170px 1fr",
    alignItems: "center",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "8px",
  },
  detailKey: {
    fontWeight: 700,
    color: "var(--text-main)",
  },
  detailValue: {
    margin: 0,
    color: "var(--text-main)",
  },
  link: {
    color: "#3b82f6",
    fontWeight: 700,
    textDecoration: "none",
    overflowWrap: "anywhere",
  },
  buttonRow: {
    marginTop: "28px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryBtn: {
    border: "none",
    background: "#2f80ed",
    color: "#fff",
    borderRadius: "8px",
    padding: "12px 18px",
    fontWeight: 700,
    minWidth: "160px",
    cursor: "pointer",
  },
  dangerBtn: {
    border: "none",
    background: "#d63031",
    color: "#fff",
    borderRadius: "8px",
    padding: "12px 18px",
    fontWeight: 700,
    minWidth: "160px",
    cursor: "pointer",
  },
  ghostBtn: {
    border: "1px solid var(--border-color)",
    background: "var(--surface-card)",
    color: "var(--text-main)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
