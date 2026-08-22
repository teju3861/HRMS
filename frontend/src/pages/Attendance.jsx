import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { attendanceApi } from "../services/api";

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isTodayRecord(record) {
  if (!record) return false;
  const now = new Date();
  if (record.checkIn && isSameDay(record.checkIn, now)) return true;
  if (record.createdAt && isSameDay(record.createdAt, now)) return true;
  if (record.date && isSameDay(record.date, now)) return true;
  return false;
}

function Attendance() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR Officer";

  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [todayRecord, setTodayRecord] = useState(null);

  const fetchAttendanceRecords = async (filter = statusFilter) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await attendanceApi.getAttendance(filter);
      const list = Array.isArray(data) ? data : [];
      setRecords(list);

      // Check today's record for employee
      const todayMatch = list.find((rec) => {
        if (isAdminOrHR) {
          const recEmpId = rec.employee?._id || rec.employee;
          return isTodayRecord(rec) && recEmpId === user?._id;
        }
        return isTodayRecord(rec);
      });
      setTodayRecord(todayMatch || null);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceRecords(statusFilter);
  }, [statusFilter]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await attendanceApi.checkIn();
      setTodayRecord(result);
      setSuccessMessage("Check-in successful! Attendance recorded for today.");
      fetchAttendanceRecords(statusFilter);
    } catch (err) {
      setErrorMessage(err.message || "Check-in failed. Please try again.");
      fetchAttendanceRecords(statusFilter);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await attendanceApi.checkOut();
      setTodayRecord(result);
      setSuccessMessage("Check-out successful! Working session completed for today.");
      fetchAttendanceRecords(statusFilter);
    } catch (err) {
      setErrorMessage(err.message || "Check-out failed. Please try again.");
      fetchAttendanceRecords(statusFilter);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="pb-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1 section-title">Attendance Tracking</h2>
          <p className="text-muted mb-0 mt-1">
            {isAdminOrHR
              ? "View and monitor attendance records across the organization"
              : "Track your daily check-ins/check-outs and review your attendance history"}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"
          onClick={() => fetchAttendanceRecords(statusFilter)}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div
          className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2 mb-4"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
          <div>{errorMessage}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setErrorMessage("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show d-flex align-items-center gap-2 mb-4"
          role="alert"
        >
          <i className="bi bi-check-circle-fill flex-shrink-0"></i>
          <div>{successMessage}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Today's Check-In / Check-Out Banner */}
      <div
        className="card shadow-sm border-0 rounded-3 mb-4 text-white overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #116976 0%, #008A80 100%)",
          borderLeft: "6px solid #F4D14F",
        }}
      >
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <span className="badge bg-palette-gold text-palette-navy mb-2 fw-bold">
                Today's Session
              </span>
              <h4 className="fw-bold mb-1 text-white">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </h4>
              <p className="mb-0 text-white-50">
                Status:{" "}
                <span className="fw-bold text-white">
                  {todayRecord?.checkOut
                    ? "Completed (Checked Out)"
                    : todayRecord?.checkIn
                      ? "Present (Checked In)"
                      : "Not Checked In Yet"}
                </span>
                {todayRecord?.checkIn && (
                  <span className="text-white-50 small ms-2">
                    (Check-in: {formatTime(todayRecord.checkIn)}
                    {todayRecord?.checkOut ? ` | Check-out: ${formatTime(todayRecord.checkOut)}` : ""})
                  </span>
                )}
              </p>
            </div>

            <div className="d-flex gap-2">
              {!todayRecord ? (
                <button
                  type="button"
                  className="btn btn-warning px-4 py-2.5 fw-bold shadow d-flex align-items-center gap-2"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Checking In...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right fs-5"></i> Check In Now
                    </>
                  )}
                </button>
              ) : !todayRecord.checkOut ? (
                <button
                  type="button"
                  className="btn btn-warning px-4 py-2.5 fw-bold shadow d-flex align-items-center gap-2"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Checking Out...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right fs-5"></i> Check Out Now
                    </>
                  )}
                </button>
              ) : (
                <button type="button" className="btn btn-light text-dark px-4 py-2.5 fw-bold" disabled>
                  <i className="bi bi-check2-all me-1"></i> Session Completed
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Card */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
              <i className="bi bi-calendar3 text-palette-teal"></i>
              Attendance History ({records.length})
            </h5>

            {/* Filter by status */}
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="statusFilter" className="small text-muted mb-0 text-nowrap fw-semibold">
                Filter Status:
              </label>
              <select
                id="statusFilter"
                className="form-select form-select-sm"
                style={{ width: "160px" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Half-day">Half-day</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-palette-teal mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mb-0">Loading attendance records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clipboard-x fs-1 d-block mb-2 text-secondary"></i>
              <p className="mb-0">No attendance records found matching criteria.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {isAdminOrHR && <th>Employee</th>}
                    <th>Date</th>
                    <th>Check-In Time</th>
                    <th>Check-Out Time</th>
                    <th>Status</th>
                    <th>Recorded Date</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      {isAdminOrHR && (
                        <td>
                          <div className="fw-bold text-palette-navy">
                            {rec.employee?.name || "Staff Member"}
                          </div>
                          <small className="text-muted">
                            {rec.employee?.employeeId || ""} &bull;{" "}
                            {rec.employee?.department || "General"}
                          </small>
                        </td>
                      )}
                      <td className="fw-semibold">{formatDate(rec.date)}</td>
                      <td>{formatTime(rec.checkIn)}</td>
                      <td>{formatTime(rec.checkOut)}</td>
                      <td>
                        <span
                          className={`badge ${
                            rec.status === "Present"
                              ? "bg-success-subtle text-success"
                              : rec.status === "Half-day"
                                ? "bg-warning-subtle text-warning-emphasis"
                                : rec.status === "Leave"
                                  ? "bg-info-subtle text-info-emphasis"
                                  : "bg-danger-subtle text-danger"
                          } px-2 py-1`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="small text-muted">{formatDate(rec.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Attendance;
