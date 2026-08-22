import React, { useState } from "react";

const ApplyLeave = ({ onLeaveSubmitted }) => {
  const [formData, setFormData] = useState({
    leaveType: "Casual",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5001/api/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit leave application");
      }

      setMessage({
        type: "success",
        text: "Leave application submitted successfully!",
      });

      setFormData({
        leaveType: "Casual",
        startDate: "",
        endDate: "",
        remarks: "",
      });

      if (onLeaveSubmitted) {
        onLeaveSubmitted(data);
      }
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "600px" }}>
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white py-3">
          <h5 className="card-title mb-0 fw-bold">Apply for Leave</h5>
        </div>
        <div className="card-body p-4">
          {message.text && (
            <div
              className={`alert alert-${message.type} alert-dismissible fade show`}
              role="alert"
            >
              {message.text}
              <button
                type="button"
                className="btn-close"
                onClick={() => setMessage({ type: "", text: "" })}
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="leaveType" className="form-label fw-semibold text-secondary">
                Leave Type
              </label>
              <select
                className="form-select"
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
              >
                <option value="Casual">Casual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Paid">Paid Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="startDate" className="form-label fw-semibold text-secondary">
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="endDate" className="form-label fw-semibold text-secondary">
                  End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="endDate"
                  name="endDate"
                  min={formData.startDate}
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="remarks" className="form-label fw-semibold text-secondary">
                Remarks / Reason
              </label>
              <textarea
                className="form-control"
                id="remarks"
                name="remarks"
                rows="3"
                placeholder="State the reason for your leave request..."
                value={formData.remarks}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Leave Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
