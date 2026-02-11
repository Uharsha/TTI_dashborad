import React, { useState } from "react";
import EmptyState from "./pages/EmptyState";
import "./StudentDiv.css";
import { useToast } from "./ui/ToastContext";
import {
  headApproveStudent,
  headRejectStudent,
  teacherApproveStudent,
  teacherRejectStudent,
} from "../server/Api";

function StudentTable({ students, refresh }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const role = localStorage.getItem("role");
  const toast = useToast();

  if (!Array.isArray(students) || students.length === 0) {
    return <EmptyState />;
  }

  const handleAction = async (actionFn, id) => {
    try {
      await actionFn(id);
      setSelectedStudent(null);
      refresh();
      toast.success("Action completed.");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Action failed.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SUBMITTED":
        return "#0d6efd";
      case "SELECTED":
        return "#198754";
      case "REJECTED":
      case "HEAD_REJECTED":
        return "#dc3545";
      default:
        return "#fd7e14";
    }
  };

  const renderDocLink = (label, url) =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        style={styles.docLink}
      >
        {label}
      </a>
    ) : null;

  return (
    <div style={styles.tableContainer}>
      {students.map((s) => (
        <div
          key={s._id}
          style={{
            ...styles.card,
            borderLeft: `6px solid ${getStatusColor(s.status)}`,
          }}
        >
          {s.passport_photo ? (
            <a href={s.passport_photo} target="_blank" rel="noreferrer" title="Open passport photo">
              <img src={s.passport_photo} alt={`${s.name} passport`} style={styles.cardImage} />
            </a>
          ) : (
            <img src="/default-user.png" alt="user" style={styles.cardImage} />
          )}
          <h3 style={styles.cardName}>{s.name}</h3>
          <p style={styles.cardCourse}>{s.course}</p>
          <button onClick={() => setSelectedStudent(s)} style={styles.viewButton}>
            View Profile
          </button>
        </div>
      ))}

      {selectedStudent && (
        <div className="modalOverlay">
          <div className="modalContent">
            <button onClick={() => setSelectedStudent(null)} style={styles.closeButton}>
              x
            </button>

            <div className="profileHeader">
              {selectedStudent.passport_photo ? (
                <a href={selectedStudent.passport_photo} target="_blank" rel="noreferrer" title="Open passport photo">
                  <img src={selectedStudent.passport_photo} alt="Student profile" className="profileImage" />
                </a>
              ) : (
                <img src="/default-user.png" alt="Student profile" className="profileImage" />
              )}
              <div>
                <h2 style={styles.profileName}>{selectedStudent.name}</h2>
                <p style={{ ...styles.profileStatus, color: getStatusColor(selectedStudent.status) }}>
                  Status: {selectedStudent.status}
                </p>
              </div>
            </div>

            <div className="detailsGrid">
              <div>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href={`mailto:${selectedStudent.email}`} style={styles.link}>
                    {selectedStudent.email}
                  </a>
                </p>
                <p>
                  <strong>Mobile:</strong>
                  <a href={`tel:${selectedStudent.mobile}`} style={styles.link}>
                    {selectedStudent.mobile}
                  </a>
                </p>
                <p><strong>DOB:</strong> {new Date(selectedStudent.dob).toLocaleDateString()}</p>
                <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                <p><strong>State/Dist:</strong> {selectedStudent.state}, {selectedStudent.district}</p>
              </div>
              <div>
                <p><strong>Disability:</strong> {selectedStudent.disabilityStatus}</p>
                <p><strong>Education:</strong> {selectedStudent.education}</p>
                <p><strong>Computer:</strong> {selectedStudent.basicComputerKnowledge}</p>
                <p><strong>English:</strong> {selectedStudent.basicEnglishSkills}</p>
                <p><strong>Enrolled:</strong> {selectedStudent.enrolledCourse}</p>
                <p style={styles.rulesText}>
                  TTI Rules: <strong>Candidate has accepted the rules and regulations</strong>
                </p>
              </div>
            </div>

            <div style={styles.documentsSection}>
              <h4 style={styles.documentsTitle}>Verification Documents</h4>
              <div style={styles.documentsGrid}>
                {renderDocLink("Aadhar", selectedStudent.adhar)}
                {renderDocLink("UDID Card", selectedStudent.UDID)}
                {renderDocLink("Disability Cert", selectedStudent.disability)}
                {renderDocLink("Degree Memo", selectedStudent.Degree_memo)}
                {renderDocLink("Medical certificate", selectedStudent.doctor)}
              </div>
            </div>

            <div className="actionsSection">
              {selectedStudent.status === "SUBMITTED" && (
                <>
                  <button
                    onClick={() => handleAction(headApproveStudent, selectedStudent._id)}
                    style={{ ...styles.actionButton, backgroundColor: "#28a745" }}
                  >
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleAction(headRejectStudent, selectedStudent._id)}
                    style={{ ...styles.actionButton, backgroundColor: "#dc3545" }}
                  >
                    Reject Application
                  </button>
                </>
              )}
              {selectedStudent.status === "HEAD_ACCEPTED" && role === "TEACHER" && (
                <a
                  href={`${role === "TEACHER" ? "/teacher-dashboard" : "/head-dashboard"}/interview/details/${selectedStudent._id}`}
                  style={{ ...styles.actionButton, backgroundColor: "#ffc107", color: "#000", textDecoration: "none", textAlign: "center" }}
                >
                  Schedule Interview
                </a>
              )}
              {selectedStudent.status === "INTERVIEW_SCHEDULED" && (
                <>
                  <button
                    onClick={() => handleAction(teacherApproveStudent, selectedStudent._id)}
                    style={{ ...styles.actionButton, backgroundColor: "#007bff" }}
                  >
                    Confirm Selection
                  </button>
                  <button
                    onClick={() => handleAction(teacherRejectStudent, selectedStudent._id)}
                    style={{ ...styles.actionButton, backgroundColor: "#dc3545" }}
                  >
                    Final Reject
                  </button>
                </>
              )}
              {selectedStudent.decisionDone && (
                <p style={styles.finalMessage}>Decision has been finalized for this candidate.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  tableContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
    padding: "20px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "15px",
    width: "100%",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
    transition: "all 0.3s ease",
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: "50%",
    objectFit: "cover",
  },
  cardName: {
    margin: "10px 0 5px",
    color: "#2c3e50",
    fontWeight: "700",
  },
  cardCourse: {
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "600",
  },
  viewButton: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
  },
  closeButton: {
    position: "absolute",
    top: "15px",
    right: "20px",
    border: "none",
    background: "none",
    fontSize: "24px",
    cursor: "pointer",
  },
  profileName: {
    margin: 0,
    color: "#2c3e50",
    fontWeight: "700",
  },
  profileStatus: {
    fontWeight: "bold",
    margin: "5px 0",
  },
  link: {
    textDecoration: "none",
    color: "#667eea",
    fontWeight: "600",
  },
  rulesText: {
    fontStyle: "italic",
    color: "#555",
  },
  documentsSection: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
  },
  documentsTitle: {
    margin: "0 0 10px 0",
    color: "#2c3e50",
    fontWeight: "700",
  },
  documentsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  docLink: {
    padding: "5px 10px",
    backgroundColor: "#e9ecef",
    borderRadius: "5px",
    textDecoration: "none",
    color: "#495057",
    fontSize: "12px",
    border: "1px solid #ced4da",
  },
  actionButton: {
    flex: 1,
    minWidth: "120px",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  finalMessage: {
    width: "100%",
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
};

export default StudentTable;

