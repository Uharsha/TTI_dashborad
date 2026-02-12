import { useEffect, useState } from "react";
import { getNotifications } from "../../server/Api";

export default function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getNotifications()
      .then((res) => setRows(res?.data?.notifications || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.wrap}>
      <h2 style={styles.title}>Audit Log Panel</h2>
      {loading ? (
        <p style={styles.muted}>Loading logs...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={3} style={styles.empty}>No audit entries found.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row?.meta?.type || row.role || "EVENT"}</td>
                  <td>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: "1080px", margin: "0 auto", padding: "1.5rem 1rem 2rem" },
  title: { margin: "0 0 1rem", color: "var(--text-main)" },
  muted: { color: "var(--text-muted)" },
  tableWrap: { overflowX: "auto", border: "1px solid var(--border-color)", borderRadius: 12, background: "var(--surface-card)" },
  table: { width: "100%", borderCollapse: "collapse", color: "var(--text-main)" },
  empty: { textAlign: "center", padding: "16px", color: "var(--text-muted)" },
};
