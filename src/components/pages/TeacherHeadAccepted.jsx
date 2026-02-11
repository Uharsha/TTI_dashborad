import StudentList from "./StudentList";
import { getTeacherHeadAcceptedStudents } from "../../server/Api";

export default function TeacherHeadAccepted() {
  return (
    <StudentList
      title="Head Accepted Admissions"
      fetchFn={getTeacherHeadAcceptedStudents}
    />
  );
}
