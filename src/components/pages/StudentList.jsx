import { useEffect, useState, useCallback, useMemo } from "react";
import StudentTable from "../StudentTable";
import { getNotifications, headApproveStudent, headDeleteStudent, headRejectStudent, markAllNotificationsRead } from "../../server/Api";
import { useToast } from "../ui/ToastContext";

const ALL_COURSES = [
  "DBMS",
  "CloudComputing",
  "Accessibility",
  "BasicComputers",
  "MachineLearning",
];
const ACTION_REFRESH_DELAY_MS = 5000;

export default function StudentList({ title, fetchFn }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const toast = useToast();

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

  useEffect(() => {
    getNotifications()
      .then((res) =>
        setRecentActivity(
          (res?.data?.notifications || []).filter((n) => !n.isRead).slice(0, 5)
        )
      )
      .catch(() => setRecentActivity([]));
  }, [students]);

  const markRecentSeen = async () => {
    try {
      await markAllNotificationsRead();
      setRecentActivity([]);
      toast.success("Recent activity marked as seen.");
    } catch {
      toast.error("Unable to mark as seen.");
    }
  };

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

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedIds(filteredStudents.map((s) => s._id));
  };

  const clearSelected = () => setSelectedIds([]);

  const runBulk = async (type) => {
    if (!selectedIds.length || bulkLoading) return;
    setBulkLoading(true);
    const apiFn =
      type === "approve"
        ? headApproveStudent
        : type === "reject"
          ? headRejectStudent
          : (id) => headDeleteStudent(id, "Bulk action");
    try {
      const results = await Promise.allSettled(selectedIds.map((id) => apiFn(id)));
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      toast.success(`Bulk ${type}: ${ok} success${fail ? `, ${fail} failed` : ""}. Refreshing in 5 seconds...`);
      clearSelected();
      window.setTimeout(() => {
        window.location.reload();
      }, ACTION_REFRESH_DELAY_MS);
    } catch {
      toast.error("Bulk action failed.");
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.skeletonGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={styles.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>{title}</h2>
        <span style={styles.countBadge}>
          {search.trim() ? `${shownCount} / ${totalCount}` : totalCount}
        </span>
      </div>
      {isHead && (
        <div style={styles.bulkRow}>
          <button type="button" style={styles.bulkBtn} onClick={selectAllVisible}>Select Visible</button>
          <button type="button" style={styles.bulkBtn} onClick={clearSelected}>Clear</button>
          <button type="button" style={styles.bulkBtn} disabled={bulkLoading || !selectedIds.length} onClick={() => runBulk("approve")}>Bulk Approve</button>
          <button type="button" style={styles.bulkBtn} disabled={bulkLoading || !selectedIds.length} onClick={() => runBulk("reject")}>Bulk Reject</button>
          <button type="button" style={styles.bulkDangerBtn} disabled={bulkLoading || !selectedIds.length} onClick={() => runBulk("delete")}>Bulk Delete</button>
          <span style={styles.bulkCount}>{selectedIds.length} selected</span>
        </div>
      )}
      <div style={styles.filtersRow}>
        <label htmlFor="student-search" style={styles.srOnly}>Search students</label>
        <input
          id="student-search"
          type="text"
          placeholder="Search by name, email, mobile, course, status"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search students by name, email, mobile, course or status"
          style={{
            ...styles.searchInput,
            ...(isHead ? styles.searchInputHead : styles.searchInputTeacher),
          }}
        />
        {isHead && (
          <>
            <label htmlFor="course-filter" style={styles.srOnly}>Filter by course</label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            aria-label="Filter students by course"
            style={styles.courseSelect}
          >
            {courseOptions.map((course) => (
              <option key={course} value={course}>
                {course === "ALL" ? "ALL" : course}
              </option>
            ))}
          </select>
          </>
        )}
      </div>
      <div style={styles.activityCard}>
        <div style={styles.activityHeader}>
          <h4 style={styles.activityTitle}>Recent Activity</h4>
          {recentActivity.length > 0 && (
            <button type="button" style={styles.activityActionBtn} onClick={markRecentSeen}>Mark as Seen</button>
          )}
        </div>
        {recentActivity.length === 0 ? (
          <p style={styles.activityEmpty}>No recent updates.</p>
        ) : (
          <ul style={styles.activityList}>
            {recentActivity.map((a) => (
              <li key={a._id} style={styles.activityItem}>
                <strong>{a.title}</strong>
                <span>{a.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <StudentTable
        students={filteredStudents}
        refresh={refresh}
        enableSelection={isHead}
        selectedIds={selectedIds}
        onToggleSelected={toggleSelected}
      />
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
    minHeight: "320px",
    padding: "1.5rem",
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
  skeletonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "12px",
  },
  skeletonCard: {
    height: "170px",
    borderRadius: "12px",
    background: "linear-gradient(90deg, #e6eaf5 25%, #f4f7ff 37%, #e6eaf5 63%)",
    backgroundSize: "400% 100%",
    animation: "pulse 1.2s ease infinite",
  },
  bulkRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "12px",
  },
  bulkBtn: {
    border: "1px solid #d0d7ee",
    background: "#fff",
    color: "#24324d",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  bulkDangerBtn: {
    border: "1px solid #ef9a9a",
    background: "#ffebee",
    color: "#b71c1c",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  bulkCount: {
    alignSelf: "center",
    fontWeight: 700,
    color: "#3949ab",
  },
  activityCard: {
    maxWidth: "900px",
    margin: "0 auto 12px auto",
    border: "1px solid var(--border-color)",
    background: "var(--surface-card)",
    borderRadius: "10px",
    padding: "10px",
  },
  activityTitle: {
    margin: 0,
    color: "var(--text-main)",
  },
  activityHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
    gap: "8px",
  },
  activityActionBtn: {
    border: "1px solid #d0d7ee",
    background: "#fff",
    color: "#334155",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "12px",
  },
  activityEmpty: {
    color: "var(--text-muted)",
    margin: 0,
  },
  activityList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: "6px",
  },
  activityItem: {
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    padding: "8px",
    display: "grid",
    gap: "3px",
    color: "var(--text-main)",
  },
  srOnly: {
    border: 0,
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: 0,
    position: "absolute",
    width: "1px",
  },
};
