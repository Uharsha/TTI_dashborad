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
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>Student Full Details</h2>

      <div style={{ marginTop: "20px" }}>
        <p><b>ID:</b> {id}</p>
        <p><b>Name:</b> {student.name}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Status:</b> {student.status}</p>
      </div>

      {role === "HEAD" && page === "PENDING" && (
        <div style={{ marginTop: "30px" }}>
          <button onClick={handleHeadApprove}>Head Approve</button>
          {"  "}
          <button onClick={handleHeadReject}>Head Reject</button>
        </div>
      )}

      {role === "TEACHER" && page === "HEAD_ACCEPTED" && (
        <div style={{ marginTop: "30px" }}>
          <button onClick={handleTeacherApprove}>Teacher Approve</button>
          {"  "}
          <button onClick={handleTeacherReject}>Teacher Reject</button>
        </div>
      )}
    </div>
  );
}

export default MoreData;

