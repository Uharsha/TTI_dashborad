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

  if (!student) return <p>No data found</p>;

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
    <div style={styles.pageWrap}>
      <div style={styles.card}>
      <h2 style={styles.title}>Student Full Details</h2>

      <div style={styles.details}>
        <p><b>ID:</b> {id}</p>
        <p><b>Name:</b> {student.name}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Status:</b> {student.status}</p>
        <p><b>NVDA Knowledge:</b> {student.ScreenReader || "N/A"}</p>
      </div>

      {role === "HEAD" && page === "PENDING" && (
        <div style={styles.buttonRow}>
          <button style={styles.primaryBtn} onClick={handleHeadApprove}>Head Approve</button>
          {"  "}
          <button style={styles.dangerBtn} onClick={handleHeadReject}>Head Reject</button>
        </div>
      )}

      {role === "TEACHER" && page === "HEAD_ACCEPTED" && (
        <div style={styles.buttonRow}>
          <button style={styles.primaryBtn} onClick={handleTeacherApprove}>Teacher Approve</button>
          {"  "}
          <button style={styles.dangerBtn} onClick={handleTeacherReject}>Teacher Reject</button>
        </div>
      )}
      </div>
    </div>
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
    background: "#f6f8fc",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    padding: "24px",
  },
  title: {
    textAlign: "center",
    margin: 0,
    color: "#1f2a44",
  },
  details: {
    marginTop: "20px",
    lineHeight: 1.8,
    color: "#2f3a55",
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
    padding: "10px 14px",
    cursor: "pointer",
  },
  dangerBtn: {
    border: "none",
    background: "#d63031",
    color: "#fff",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
  },
};
