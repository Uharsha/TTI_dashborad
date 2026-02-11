import StudentList from "../pages/StudentList";
import { getInterviewRequiredStudents} from "../../server/Api";

function Waiting_interview() {
  return (
    <StudentList
      title="Waiting for Interview"
      fetchFn={getInterviewRequiredStudents}
    />
  );
}

export default Waiting_interview;
