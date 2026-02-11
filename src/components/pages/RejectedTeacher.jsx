import StudentList from "./StudentList";
import { getTeacherRejectedStudents } from "../../server/Api";

export default function RejectedTeacher() {
  return (
    <StudentList
      title="Rejected by Teacher"
      fetchFn={getTeacherRejectedStudents}
    />
  );
}
