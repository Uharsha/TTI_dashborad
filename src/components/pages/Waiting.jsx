import StudentList from "../pages/StudentList";
import { getInterviewRequiredStudents} from "../../server/Api";

function WaitingInterview() {
  return (
    <StudentList
      title="Waiting for Interview"
      fetchFn={getInterviewRequiredStudents}
    />
  );
}

export default WaitingInterview;
