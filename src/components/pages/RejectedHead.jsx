import StudentList from "./StudentList";
import { getHeadRejectedStudents } from "../../server/Api";

export default function RejectedHead() {
  return (
    <StudentList
      title="Rejected by Head"
      fetchFn={getHeadRejectedStudents}
    />
  );
}
