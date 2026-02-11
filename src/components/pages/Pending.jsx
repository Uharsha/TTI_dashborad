


// import { useState, useEffect } from "react";
// import StudentTable from "../StudentTable";


// export default function StudentList({ title, fetchFn }) {
//   const [students, setStudents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchFn()
//       .then(res => setStudents(res.data))
//       .catch(err => console.log(err))
//       .finally(() => setLoading(false));
//   }, [fetchFn]);

//   return (
//     <div>
//       <h2>{title}</h2>
//       {loading ? <p>Loading...</p> : <StudentTable students={students} />}
//     </div>
//   );
// }



import StudentList from "./StudentList";
import { getPendingStudents } from "../../server/Api";

export default function HeadAccepted() {
  return (
    <StudentList
      title="Pending Admissions"
      fetchFn={getPendingStudents}
    />
  );
}
