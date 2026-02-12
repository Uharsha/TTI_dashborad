import { useEffect, useMemo, useState } from "react";
import { getInterviewRequiredStudents } from "../../server/Api";

export default function InterviewCalendar() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    getInterviewRequiredStudents()
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const dateKey = item?.interview?.date
        ? new Date(item.interview.date).toISOString().slice(0, 10)
        : "unscheduled";
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey).push(item);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Interview Calendar</h2>
      {loading ? (
        <p style={styles.muted}>Loading interview slots...</p>
      ) : grouped.length === 0 ? (
        <div style={styles.empty}>No scheduled interviews found.</div>
      ) : (
        <div style={styles.grid}>
          {grouped.map(([date, students]) => (
            <section key={date} style={styles.card}>
              <h3 style={styles.date}>
                {date === "unscheduled" ? "No Date" : new Date(date).toDateString()}
              </h3>
              <div style={styles.list}>
                {students.map((s) => (
                  <div key={s._id} style={styles.item}>
                    <strong>{s.name}</strong>
                    <span>{s.course}</span>
                    <small>{s?.interview?.time || "Time pending"} | {s?.interview?.platform || "Platform pending"}</small>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "1080px", margin: "0 auto", padding: "1.5rem 1rem 2rem" },
  title: { margin: "0 0 1rem", color: "var(--text-main)" },
  muted: { color: "var(--text-muted)" },
  empty: { border: "1px dashed var(--border-color)", borderRadius: 12, padding: "1.5rem", color: "var(--text-muted)", background: "var(--surface-card)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" },
  card: { border: "1px solid var(--border-color)", background: "var(--surface-card)", borderRadius: 12, padding: "12px" },
  date: { margin: "0 0 10px", color: "var(--text-main)", fontSize: "1rem" },
  list: { display: "grid", gap: "8px" },
  item: { border: "1px solid var(--border-color)", borderRadius: 8, padding: "8px", display: "grid", gap: 3, color: "var(--text-main)" },
};
