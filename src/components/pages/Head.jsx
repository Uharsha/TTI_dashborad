import React from 'react';
import TeacherAccepted from './TeacherAccepted';
import RejectedTeacher from './RejectedTeacher';
import HeadAccepted from './HeadAccepted';
import RejectedHead from './RejectedHead';
import Pending from './Pending';
import { Routes, Route, Navigate } from 'react-router-dom';
function Head() {
    return ( 
        <div>
            <Routes>
              <Route path="/" element={<Navigate to="pending" replace />} />
              <Route path="pending" element={<Pending />} />
              <Route path="head-accepted" element={<HeadAccepted />} />
              <Route path="rejected-head" element={<RejectedHead />} />
              <Route path="head-rejected" element={<RejectedHead />} />
              <Route path="teacher-accepted" element={<TeacherAccepted />} />
              <Route path="rejected-teacher" element={<RejectedTeacher />} />
            </Routes>
        </div>
     );
}

export default Head;
