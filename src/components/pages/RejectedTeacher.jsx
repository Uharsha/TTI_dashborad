import StudentList from "./StudentList";
import { getTeacherRejectedStudents, getHeadFinalRejectedStudents } from "../../server/Api";

export default function RejectedTeacher() {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const fetchFn = role === "HEAD" ? getHeadFinalRejectedStudents : getTeacherRejectedStudents;

  return (
    <StudentList
      title="Rejected by Teacher"
      fetchFn={fetchFn}
    />
  );
}
