import StudentList from "./StudentList";
import { getTeacherAcceptedStudents, getHeadFinalSelectedStudents } from "../../server/Api";

export default function TeacherAccepted() {
  const role = (localStorage.getItem("role") || "").toUpperCase();
  const fetchFn = role === "HEAD" ? getHeadFinalSelectedStudents : getTeacherAcceptedStudents;

  return (
    <StudentList
      title="Final Confirmed Admissions"
      fetchFn={fetchFn}
    />
  );
}
