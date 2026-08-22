import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { leaveApi } from "../services/api";

const ApplyLeave = ({ onLeaveSubmitted }) => {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR Officer";

  const [activeTab, setActiveTab] = useState("apply");
  const [formData, setFormData] = useState({
    leaveType: "Paid",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const [leavesList, setLeavesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLeaves, setFetchingLeaves] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Admin action state
  const [processingId, setProcessingId] = useState(null);
  const [adminCommentInput, setAdminCommentInput] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchLeaves = async () => {
    setFetchingLeaves(true);
    try {
      const data = await leaveApi.getLeaves();
      setLeavesList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch leaves:", error);
    } finally {
      setFetchingLeaves(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

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
      const result = await leaveApi.applyLeave({
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        remarks: formData.remarks,
      });

      setMessage({
        type: "success",
        text: "Leave application submitted successfully!",
      });

      setFormData({
        leaveType: "Paid",
        startDate: "",
        endDate: "",
        remarks: "",
      });

      fetchLeaves();

      if (onLeaveSubmitted) {
        onLeaveSubmitted(result);
      }
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message || "Failed to submit leave application.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (leaveId, status) => {
    setProcessingId(leaveId);
    setMessage({ type: "", text: "" });

    try {
      const comment =
        adminCommentInput[leaveId] ||
        `${status} by ${user?.name || "Admin"}`;

      await leaveApi.updateLeave(leaveId, {
        status,
        adminComment: comment,
      });

      setMessage({
        type: "success",
        text: `Leave request has been ${status.toLowerCase()}.`,
      });

      fetchLeaves();
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.message || `Failed to update leave request.`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const filteredLeaves = leavesList.filter((leave) => {
    if (statusFilter === "All") return true;
    return leave.status === statusFilter;
  });

  return (
    <div className="container py-2" style={{ maxWidth: "1000px" }}>
      {/* Module Title */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1 section-title">Leave Management</h2>
          <p className="text-muted mb-0 mt-1">
            {isAdminOrHR
              ? "Submit leave requests and process employee leave applications"
              : "Apply for leaves and track your application status"}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="btn-group shadow-sm rounded-pill p-1 bg-white border">
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              activeTab === "apply" ? "btn-primary fw-bold" : "btn-light text-muted border-0"
            }`}
            onClick={() => setActiveTab("apply")}
          >
            <i className="bi bi-pencil-square me-1"></i> Apply Leave
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 ${
              activeTab === "history" ? "btn-primary fw-bold" : "btn-light text-muted border-0"
            }`}
            onClick={() => {
              setActiveTab("history");
              fetchLeaves();
            }}
          >
            <i className="bi bi-clock-history me-1"></i> My Applications ({leavesList.length})
          </button>
          {isAdminOrHR && (
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 ${
                activeTab === "approvals" ? "btn-primary fw-bold" : "btn-light text-muted border-0"
              }`}
              onClick={() => {
                setActiveTab("approvals");
                fetchLeaves();
              }}
            >
              <i className="bi bi-check2-square me-1"></i> Employee Approvals (
              {leavesList.filter((l) => l.status === "Pending").length})
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {message.text && (
        <div
          className={`alert alert-${message.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-4`}
          role="alert"
        >
          <i
            className={`bi ${
              message.type === "success"
                ? "bi-check-circle-fill"
                : "bi-exclamation-triangle-fill"
            } flex-shrink-0`}
          ></i>
          <div>{message.text}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setMessage({ type: "", text: "" })}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* TAB 1: APPLY FOR LEAVE FORM */}
      {activeTab === "apply" && (
        <div className="card shadow-sm border-0 rounded-4 mx-auto overflow-hidden" style={{ maxWidth: "680px" }}>
          <div
            className="card-header text-white p-4 text-center"
            style={{
              background: "linear-gradient(135deg, #2F4858 0%, #116976 50%, #008A80 100%)",
              borderBottom: "4px solid #F4D14F",
            }}
          >
            <h5 className="card-title mb-0 fw-bold d-flex align-items-center justify-content-center gap-2 text-white">
              <i className="bi bi-calendar-plus text-palette-gold fs-4"></i> New Leave Application
            </h5>
          </div>
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              {/* Leave Type */}
              <div className="mb-3">
                <label htmlFor="leaveType" className="form-label fw-semibold text-palette-navy">
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
                  <option value="Paid">Paid Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Unpaid">Unpaid Leave</option>
                </select>
                <div className="form-text small">
                  Select whether this is Paid, Sick, or Unpaid leave.
                </div>
              </div>

              {/* Dates */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="startDate" className="form-label fw-semibold text-palette-navy">
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
                  <label htmlFor="endDate" className="form-label fw-semibold text-palette-navy">
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

              {formData.startDate && formData.endDate && (
                <div className="alert alert-light border py-2 mb-3 small d-flex align-items-center gap-2">
                  <i className="bi bi-info-circle text-palette-teal fs-5"></i>
                  Total Leave Duration:{" "}
                  <strong className="text-palette-navy">{calculateDays(formData.startDate, formData.endDate)} day(s)</strong>
                </div>
              )}

              {/* Remarks */}
              <div className="mb-4">
                <label htmlFor="remarks" className="form-label fw-semibold text-palette-navy">
                  Reason / Remarks
                </label>
                <textarea
                  className="form-control"
                  id="remarks"
                  name="remarks"
                  rows="3"
                  placeholder="Please describe the reason for your leave request..."
                  value={formData.remarks}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span> Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send"></i> Submit Leave Application
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MY LEAVE APPLICATIONS */}
      {activeTab === "history" && (
        <div className="card shadow-sm border-0 rounded-3">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-text text-palette-teal"></i>
              My Leave History
            </h5>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              onClick={fetchLeaves}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>

          <div className="card-body p-0">
            {fetchingLeaves ? (
              <div className="text-center py-5">
                <div className="spinner-border text-palette-teal mb-3" role="status"></div>
                <p className="text-muted mb-0">Loading leave requests...</p>
              </div>
            ) : leavesList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-calendar-x fs-1 d-block mb-2 text-secondary"></i>
                <p className="mb-2">You have not submitted any leave applications yet.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveTab("apply")}
                >
                  Apply for Leave Now
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Leave Type</th>
                      <th>Duration</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Admin Comment</th>
                      <th>Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leavesList.map((leave) => (
                      <tr key={leave._id}>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-palette-navy">
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary">
                            {calculateDays(leave.startDate, leave.endDate)}d
                          </span>
                        </td>
                        <td className="small text-muted">{leave.remarks || "--"}</td>
                        <td>
                          <span
                            className={`badge ${
                              leave.status === "Approved"
                                ? "bg-success-subtle text-success"
                                : leave.status === "Rejected"
                                  ? "bg-danger-subtle text-danger"
                                  : "bg-warning-subtle text-warning-emphasis"
                            } px-2 py-1`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {leave.adminComment ? (
                            <span className="text-dark fw-semibold">
                              {leave.adminComment}
                            </span>
                          ) : (
                            "--"
                          )}
                        </td>
                        <td className="small text-muted">{formatDate(leave.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADMIN APPROVALS */}
      {isAdminOrHR && activeTab === "approvals" && (
        <div className="card shadow-sm border-0 rounded-3">
          <div className="card-header bg-white py-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                <i className="bi bi-shield-check text-palette-teal"></i>
                Employee Leave Requests Management
              </h5>

              {/* Status Filter */}
              <div className="btn-group btn-group-sm">
                {["All", "Pending", "Approved", "Rejected"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn ${
                      statusFilter === st ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => setStatusFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {fetchingLeaves ? (
              <div className="text-center py-5">
                <div className="spinner-border text-palette-teal mb-3" role="status"></div>
                <p className="text-muted mb-0">Loading employee leave requests...</p>
              </div>
            ) : filteredLeaves.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check2-circle fs-1 d-block mb-2 text-success"></i>
                <p className="mb-0">No leave requests found for filter "{statusFilter}".</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Admin Note / Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaves.map((leave) => (
                      <tr key={leave._id}>
                        <td>
                          <div className="fw-bold text-palette-navy">
                            {leave.employee?.name || "Staff Member"}
                          </div>
                          <small className="text-muted">
                            {leave.employee?.employeeId || ""} &bull;{" "}
                            {leave.employee?.department || "General"}
                          </small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {leave.leaveType}
                          </span>
                        </td>
                        <td>
                          <small className="d-block fw-semibold text-dark">
                            {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                          </small>
                          <small className="text-muted">
                            {calculateDays(leave.startDate, leave.endDate)} days
                          </small>
                        </td>
                        <td className="small text-muted" style={{ maxWidth: "200px" }}>
                          {leave.remarks || "--"}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              leave.status === "Approved"
                                ? "bg-success-subtle text-success"
                                : leave.status === "Rejected"
                                  ? "bg-danger-subtle text-danger"
                                  : "bg-warning-subtle text-warning-emphasis"
                            } px-2 py-1`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td>
                          {leave.status === "Pending" ? (
                            <div className="d-flex flex-column gap-1" style={{ minWidth: "220px" }}>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Add review comment..."
                                value={adminCommentInput[leave._id] || ""}
                                onChange={(e) =>
                                  setAdminCommentInput({
                                    ...adminCommentInput,
                                    [leave._id]: e.target.value,
                                  })
                                }
                              />
                              <div className="btn-group btn-group-sm w-100">
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  disabled={processingId === leave._id}
                                  onClick={() => handleAdminAction(leave._id, "Approved")}
                                >
                                  {processingId === leave._id ? "..." : "Approve"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  disabled={processingId === leave._id}
                                  onClick={() => handleAdminAction(leave._id, "Rejected")}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <small className="text-muted">
                              {leave.adminComment ? `Note: ${leave.adminComment}` : "Completed"}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
