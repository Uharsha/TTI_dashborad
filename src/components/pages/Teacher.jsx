import { Route, Routes} from "react-router-dom";
import { Navigate } from "react-router-dom";
import TeacherHeadAccepted from "./TeacherHeadAccepted";
import WaitingInterview from "./Waiting";
import Interview from "./Interview";
import TeacherAccepted from "./TeacherAccepted";
import RejectedTeacher from "./RejectedTeacher";
function Teacher() {
    return (  
        <div>
            <Routes>
             <Route path="/" element={<Navigate to="head-accepted" replace />} />
             <Route path="head-accepted" element={<TeacherHeadAccepted />} />
             <Route path="interview" element={<WaitingInterview />} />
             <Route path="interview/details/:id" element={<Interview />} />
             <Route path="teacher-accepted" element={<TeacherAccepted />} />
             <Route path="rejected-teacher" element={<RejectedTeacher />} />
            </Routes>
        </div>
    );
}

export default Teacher;
