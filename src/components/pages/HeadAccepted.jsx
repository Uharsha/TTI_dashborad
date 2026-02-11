import StudentList from "./StudentList";
import { getHeadAcceptedStudents } from "../../server/Api";

export default function HeadAccepted() {
  return (
    <StudentList
      title="Head Accepted Admissions"
      fetchFn={getHeadAcceptedStudents}
    />
  );
}
