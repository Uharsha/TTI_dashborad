import StudentList from "./StudentList";
import { getTeacherAcceptedStudents } from "../../server/Api";

export default function TeacherAccepted() {
  return (
    <StudentList
      title="Final Confirmed Admissions"
      fetchFn={getTeacherAcceptedStudents}
    />
  );
}
