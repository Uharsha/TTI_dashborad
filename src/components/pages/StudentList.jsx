import { useEffect, useState, useCallback, useMemo } from "react";
import StudentTable from "../StudentTable";

const ALL_COURSES = [
  "DBMS",
  "CloudComputing",
  "Accessibility",
  "BasicComputers",
  "MachineLearning",
];

export default function StudentList({ title, fetchFn }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");

  const refresh = useCallback(() => {
    setLoading(true);
    fetchFn()
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];

    const role = (localStorage.getItem("role") || "").trim().toUpperCase();
    const course = (localStorage.getItem("course") || "").trim().toUpperCase();

    if (role !== "TEACHER" || !course) return students;

    return students.filter(
      (student) => (student?.course || "").trim().toUpperCase() === course
    );
  }, [students]);

  const role = (localStorage.getItem("role") || "").trim().toUpperCase();
  const isHead = role === "HEAD";

  const courseOptions = useMemo(() => ["ALL", ...ALL_COURSES], []);

  const courseFilteredStudents = useMemo(() => {
    if (!isHead || selectedCourse === "ALL") return visibleStudents;
    return visibleStudents.filter((student) => (student?.course || "").trim() === selectedCourse);
  }, [isHead, selectedCourse, visibleStudents]);

  useEffect(() => {
    if (!courseOptions.includes(selectedCourse)) {
      setSelectedCourse("ALL");
    }
  }, [courseOptions, selectedCourse]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return courseFilteredStudents;

    return courseFilteredStudents.filter((student) => {
      const name = (student?.name || "").toLowerCase();
      const email = (student?.email || "").toLowerCase();
      const mobile = String(student?.mobile || "").toLowerCase();
      const course = (student?.course || "").toLowerCase();
      const status = (student?.status || "").toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        course.includes(query) ||
        status.includes(query)
      );
    });
  }, [courseFilteredStudents, search]);

  const totalCount = courseFilteredStudents.length;
  const shownCount = filteredStudents.length;

  if (loading) return <div style={styles.loadingContainer}><p style={styles.loadingText}>⏳ Loading...</p></div>;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>{title}</h2>
        <span style={styles.countBadge}>
          {search.trim() ? `${shownCount} / ${totalCount}` : totalCount}
        </span>
      </div>
      <div style={styles.filtersRow}>
        <input
          type="text"
          placeholder="Search by name, email, mobile, course, status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...styles.searchInput,
            ...(isHead ? styles.searchInputHead : styles.searchInputTeacher),
          }}
        />
        {isHead && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={styles.courseSelect}
          >
            {courseOptions.map((course) => (
              <option key={course} value={course}>
                {course === "ALL" ? "ALL" : course}
              </option>
            ))}
          </select>
        )}
      </div>
      <StudentTable students={filteredStudents} refresh={refresh} />
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  pageTitle: {
    fontSize: "2rem",
    fontWeight: "700",
    textAlign: "center",
    color: "#2c3e50",
    marginBottom: "2rem",
    letterSpacing: "-0.5px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    margin: 0,
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.75rem",
    marginBottom: "2rem",
    flexWrap: "wrap",
  },
  countBadge: {
    padding: "0.35rem 0.75rem",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3949ab",
    fontSize: "0.9rem",
    fontWeight: "700",
    border: "1px solid #dbe4ff",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
  },
  loadingText: {
    textAlign: "center",
    fontSize: "1.2rem",
    color: "#667eea",
    fontWeight: "600",
  },
  filtersRow: {
    display: "flex",
    gap: "0.75rem",
    margin: "0 auto 1rem auto",
    maxWidth: "900px",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: "1 1 420px",
    padding: "0.75rem 1rem",
    border: "1px solid #ced4da",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
  },
  searchInputHead: {
    maxWidth: "620px",
  },
  searchInputTeacher: {
    maxWidth: "420px",
    margin: "0 auto",
  },
  courseSelect: {
    flex: "0 0 220px",
    padding: "0.75rem 1rem",
    border: "1px solid #ced4da",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    backgroundColor: "#fff",
  },
};
