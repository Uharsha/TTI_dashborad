import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { scheduleInterview } from "../../server/Api";
import { useToast } from "../ui/ToastContext";
//  import { scheduleInterview } from "../../server/Api";
import "./Interview.css"; // ✅ Make sure this file contains your zak11h CSS

function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [interview, setInterview] = useState({
    date: "",
    time: "",
    platform: "",
    link: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setInterview({
      ...interview,
      [e.target.name]: e.target.value,
    });
  };

  const handleApprove = async () => {
    if (submitting) return;

    if (!interview.date || !interview.time || !interview.platform || !interview.link) {
      toast.error("Please fill all interview details.");
      return;
    }

    try {
      setSubmitting(true);
      await scheduleInterview(id, interview);
      toast.success("Interview scheduled and mail sent to candidate.");
      navigate("/teacher-dashboard/interview");
    } catch (err) {
      console.error(err);
      const backendMsg = err?.response?.data?.error || err?.response?.data?.message;
      toast.error(backendMsg || "Something went wrong while scheduling interview.");
    } finally {
      setSubmitting(false);
    }


  };

  return (
  <div className="interview-container">
    <h2 className="interview-title">Schedule Interview</h2>

    <div className="form-group">
      <label>Date</label>
      <input
        type="date"
        name="date"
        value={interview.date}
        onChange={handleChange}
      />
    </div>

    <div className="form-group">
      <label>Time</label>
      <input
        type="time"
        name="time"
        value={interview.time}
        onChange={handleChange}
      />
    </div>

    <div className="form-group">
      <label>Platform</label>
      <select
        name="platform"
        value={interview.platform}
        onChange={handleChange}
      >
        <option value="">Select</option>
        <option>Google Meet</option>
        <option>Zoom</option>
        <option>Microsoft Teams</option>
      </select>
    </div>

    <div className="form-group">
      <label>Meeting Link</label>
      <input
        type="text"
        name="link"
        placeholder="https://..."
        value={interview.link}
        onChange={handleChange}
      />
    </div>

    <button className="submit-btn" onClick={handleApprove} disabled={submitting}>
      {submitting ? "Sending..." : "Approve & Send Mail"}
    </button>
  </div>
  );
}

export default Interview;
