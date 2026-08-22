import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { dashboardApi, attendanceApi, leaveApi, authApi } from "../services/api";

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

function Dashboard({ onNavigate }) {
  const { user } = useAuth();
  const isAdminOrHR = user?.role === "Admin" || user?.role === "HR Officer";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Admin Dashboard Data
  const [adminData, setAdminData] = useState({
    stats: { totalEmployees: 0, present: 0, pendingLeaves: 0 },
    employees: [],
    attendance: [],
    pendingLeaves: [],
  });

  // Admin Staff / HR Account Creation State
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({
    name: "",
    employeeId: "",
    email: "",
    password: "",
    role: "HR Officer",
  });
  const [createStaffLoading, setCreateStaffLoading] = useState(false);
  const [createStaffError, setCreateStaffError] = useState("");

  // Employee Dashboard Data
  const [employeeAttendance, setEmployeeAttendance] = useState([]);
  const [employeeLeaves, setEmployeeLeaves] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Approval action loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      if (isAdminOrHR) {
        const data = await dashboardApi.getAdminDashboard();
        setAdminData({
          stats: data.stats || { totalEmployees: 0, present: 0, pendingLeaves: 0 },
          employees: data.employees || [],
          attendance: data.attendance || [],
          pendingLeaves: data.pendingLeaves || [],
        });
      } else {
        const [attendanceRes, leavesRes] = await Promise.all([
          attendanceApi.getAttendance(),
          leaveApi.getLeaves(),
        ]);

        const attendanceList = Array.isArray(attendanceRes) ? attendanceRes : [];
        const leavesList = Array.isArray(leavesRes) ? leavesRes : [];

        setEmployeeAttendance(attendanceList);
        setEmployeeLeaves(leavesList);

        // Robust match for today's attendance record
        const todayMatch = attendanceList.find((record) => isTodayRecord(record));
        setTodayRecord(todayMatch || null);
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isAdminOrHR]);

  const handleCreateStaffSubmit = async (e) => {
    e.preventDefault();
    setCreateStaffError("");

    if (!newStaffData.name || !newStaffData.employeeId || !newStaffData.email || !newStaffData.password) {
      setCreateStaffError("Please fill out all required fields.");
      return;
    }

    setCreateStaffLoading(true);

    const targetRole = user?.role === "HR Officer" ? "Employee" : newStaffData.role;

    try {
      await authApi.register({
        name: newStaffData.name.trim(),
        employeeId: newStaffData.employeeId.trim().toUpperCase(),
        email: newStaffData.email.trim().toLowerCase(),
        password: newStaffData.password,
        role: targetRole,
      });

      setSuccessMessage(`Account for ${newStaffData.name} (${targetRole}) created successfully!`);
      setNewStaffData({
        name: "",
        employeeId: "",
        email: "",
        password: "",
        role: user?.role === "HR Officer" ? "Employee" : "HR Officer",
      });
      setShowCreateStaffModal(false);
      fetchDashboardData();
    } catch (err) {
      setCreateStaffError(err.message || "Failed to create staff account.");
    } finally {
      setCreateStaffLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setSuccessMessage("");
    setError("");

    try {
      const record = await attendanceApi.checkIn();
      setTodayRecord(record);
      setSuccessMessage("Checked in successfully for today!");
      fetchDashboardData();
    } catch (err) {
      setError(err.message || "Failed to check in.");
      fetchDashboardData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setSuccessMessage("");
    setError("");

    try {
      const record = await attendanceApi.checkOut();
      setTodayRecord(record);
      setSuccessMessage("Checked out successfully for today!");
      fetchDashboardData();
    } catch (err) {
      setError(err.message || "Failed to check out.");
      fetchDashboardData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, newStatus) => {
    setActionLoadingId(leaveId);
    setError("");
    setSuccessMessage("");

    try {
      await leaveApi.updateLeave(leaveId, {
        status: newStatus,
        adminComment: `Processed by ${user.name || "Admin"}`,
      });
      setSuccessMessage(`Leave request marked as ${newStatus}.`);
      const data = await dashboardApi.getAdminDashboard();
      setAdminData({
        stats: data.stats || { totalEmployees: 0, present: 0, pendingLeaves: 0 },
        employees: data.employees || [],
        attendance: data.attendance || [],
        pendingLeaves: data.pendingLeaves || [],
      });
    } catch (err) {
      setError(err.message || `Failed to update leave request.`);
    } finally {
      setActionLoadingId(null);
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

  const isManagerOrAdmin = (emp) => {
    if (!emp) return false;
    if (emp.role === "Admin" || emp.role === "Manager") return true;
    if (emp.name && (emp.name.toLowerCase().includes("admin") || emp.name.toLowerCase().includes("manager"))) return true;
    if (emp.email && (emp.email.toLowerCase().includes("admin") || emp.email.toLowerCase().includes("manager"))) return true;
    return false;
  };

  // Compute Present and Absent Staff Today for Manager Dashboard (excluding Manager/Admin accounts)
  const presentAttendanceToday = adminData.attendance.filter(
    (att) => isTodayRecord(att) && !isManagerOrAdmin(att.employee)
  );

  const presentStaffIdSet = new Set(
    presentAttendanceToday
      .map((att) => {
        const empId = att.employee?._id || att.employee;
        return empId ? empId.toString() : null;
      })
      .filter(Boolean)
  );

  const absentWithoutLeaveList = adminData.employees.filter((emp) => {
    if (isManagerOrAdmin(emp)) return false;
    const empIdStr = emp._id ? emp._id.toString() : "";
    return !presentStaffIdSet.has(empIdStr);
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-palette-teal mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted fw-medium">Loading live dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1 section-title">
            {isAdminOrHR ? "Management Dashboard" : "Employee Dashboard"}
          </h2>
          <p className="text-muted mb-0 mt-1">
            Welcome back, <span className="fw-bold text-palette-navy">{user?.name}</span> (
            <span className="badge bg-palette-gold text-palette-navy fw-bold">
              {user?.role === "Admin" ? "Manager" : user?.role}
            </span>)
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {isAdminOrHR && (
            <button
              type="button"
              className="btn btn-primary btn-sm rounded-pill px-3 fw-bold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => setShowCreateStaffModal(!showCreateStaffModal)}
            >
              <i className="bi bi-person-plus-fill"></i> {user?.role === "HR Officer" ? "Create Employee Account" : "Create HR / Staff Account"}
            </button>
          )}

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill d-flex align-items-center gap-1 px-3"
            onClick={fetchDashboardData}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh Data
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Admin Account Creation Form Card */}
      {isAdminOrHR && showCreateStaffModal && (
        <div className="card shadow border-0 rounded-3 mb-4 overflow-hidden border-top border-4 border-palette-teal">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
              <i className="bi bi-person-plus-fill text-palette-teal fs-4"></i>
              Create New Staff or HR Officer Account
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowCreateStaffModal(false)}
              aria-label="Close"
            ></button>
          </div>
          <div className="card-body p-4">
            {createStaffError && (
              <div className="alert alert-danger py-2 small mb-3">{createStaffError}</div>
            )}
            <form onSubmit={handleCreateStaffSubmit}>
              <div className="row g-3">
                <div className="col-md-6 col-lg-3">
                  <label htmlFor="staffName" className="form-label fw-semibold text-palette-navy small">Full Name</label>
                  <input
                    id="staffName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Alex Rivera"
                    value={newStaffData.name}
                    onChange={(e) => setNewStaffData({ ...newStaffData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 col-lg-2">
                  <label htmlFor="staffEmpId" className="form-label fw-semibold text-palette-navy small">Employee ID</label>
                  <input
                    id="staffEmpId"
                    type="text"
                    className="form-control"
                    placeholder="e.g. HR002"
                    value={newStaffData.employeeId}
                    onChange={(e) => setNewStaffData({ ...newStaffData, employeeId: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label htmlFor="staffEmail" className="form-label fw-semibold text-palette-navy small">Work Email</label>
                  <input
                    id="staffEmail"
                    type="email"
                    className="form-control"
                    placeholder="alex@company.com"
                    value={newStaffData.email}
                    onChange={(e) => setNewStaffData({ ...newStaffData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 col-lg-2">
                  <label htmlFor="staffRole" className="form-label fw-semibold text-palette-navy small">Account Role</label>
                  {user?.role === "HR Officer" ? (
                    <input
                      type="text"
                      className="form-control bg-light"
                      value="Employee"
                      readOnly
                      title="HR Officers can only create Employee accounts"
                    />
                  ) : (
                    <select
                      id="staffRole"
                      className="form-select"
                      value={newStaffData.role}
                      onChange={(e) => setNewStaffData({ ...newStaffData, role: e.target.value })}
                    >
                      <option value="HR Officer">HR Officer</option>
                      <option value="Employee">Employee</option>
                    </select>
                  )}
                </div>
                <div className="col-md-6 col-lg-2">
                  <label htmlFor="staffPassword" className="form-label fw-semibold text-palette-navy small">Password</label>
                  <input
                    id="staffPassword"
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={newStaffData.password}
                    onChange={(e) => setNewStaffData({ ...newStaffData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-3"
                  onClick={() => setShowCreateStaffModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm px-4 fw-bold shadow-sm"
                  disabled={createStaffLoading}
                >
                  {createStaffLoading ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ADMIN & HR OFFICER VIEW */}
      {/* ==================================================================== */}
      {isAdminOrHR ? (
        <>
          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            {/* Total Employees */}
            <div className="col-12 col-md-4">
              <div className="card card-stat card-stat-teal shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="p-3 rounded-3 fs-3 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(0, 138, 128, 0.12)", color: "#008A80", width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Total Employees</div>
                    <div className="fs-3 fw-bold text-palette-navy">{adminData.stats.totalEmployees}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Present Records */}
            <div className="col-12 col-md-4">
              <div className="card card-stat card-stat-green shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="p-3 rounded-3 fs-3 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(73, 169, 115, 0.15)", color: "#389E4E", width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-person-check-fill"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Present Today</div>
                    <div className="fs-3 fw-bold text-palette-navy">{presentAttendanceToday.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Leaves */}
            <div className="col-12 col-md-4">
              <div className="card card-stat card-stat-gold shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="p-3 rounded-3 fs-3 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(244, 209, 79, 0.25)", color: "#2F4858", width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-calendar2-range-fill"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-semibold text-uppercase">Pending Leaves</div>
                    <div className="fs-3 fw-bold text-palette-navy">{adminData.stats.pendingLeaves}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Separate Sections for Today's Attendance: Present vs Absent/Unapproved */}
          <div className="row g-4 mb-4">
            {/* 🟢 Present Staff Attendance Today Section */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 rounded-3 h-100 border-top border-4 border-success">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                    <i className="bi bi-person-check-fill text-success fs-4"></i>
                    Present Staff Today ({presentAttendanceToday.length})
                  </h5>
                  <span className="badge bg-success-subtle text-success fw-bold">Verified Today</span>
                </div>
                <div className="card-body p-0">
                  {presentAttendanceToday.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <i className="bi bi-clock-history fs-3 d-block mb-1"></i>
                      No staff members have checked in today yet.
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "320px" }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Staff Member</th>
                            <th>Department</th>
                            <th>Check-In</th>
                            <th>Check-Out</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {presentAttendanceToday.map((att) => (
                            <tr key={att._id}>
                              <td>
                                <div className="fw-bold text-palette-navy">
                                  {att.employee?.name || "Staff Member"}
                                </div>
                                <small className="text-muted">
                                  {att.employee?.employeeId || ""}
                                </small>
                              </td>
                              <td className="small text-muted">{att.employee?.department || "General"}</td>
                              <td className="fw-semibold text-success small">{formatTime(att.checkIn)}</td>
                              <td className="small">{att.checkOut ? formatTime(att.checkOut) : "--:--"}</td>
                              <td>
                                <span className={`badge ${att.checkOut ? "bg-secondary" : "bg-success-subtle text-success"}`}>
                                  {att.checkOut ? "Completed" : "Present"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🔴 Absent / Unapproved Absences Today Section */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 rounded-3 h-100 border-top border-4 border-danger">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                    <i className="bi bi-person-x-fill text-danger fs-4"></i>
                    Absent / Unapproved Absences ({absentWithoutLeaveList.length})
                  </h5>
                  <span className="badge bg-danger-subtle text-danger fw-bold">Unexcused Today</span>
                </div>
                <div className="card-body p-0">
                  {absentWithoutLeaveList.length === 0 ? (
                    <div className="p-4 text-center text-muted">
                      <i className="bi bi-check-circle-fill text-success fs-3 d-block mb-1"></i>
                      All staff members are either present or on approved leave today!
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "320px" }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Staff Member</th>
                            <th>Role / Dept</th>
                            <th>Absence Reason</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {absentWithoutLeaveList.map((emp) => (
                            <tr key={emp._id}>
                              <td>
                                <div className="fw-bold text-palette-navy">{emp.name}</div>
                                <small className="text-muted">
                                  {emp.employeeId} &bull; {emp.email}
                                </small>
                              </td>
                              <td className="small text-muted">
                                <span className="badge bg-light text-dark me-1">{emp.role}</span>
                                {emp.department || "General"}
                              </td>
                              <td>
                                <span className="badge bg-danger-subtle text-danger">
                                  No Check-In Record
                                </span>
                              </td>
                              <td>
                                <span className="small text-muted fw-semibold">
                                  Unapproved Absence
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Leaves Approval Card */}
          <div className="card shadow-sm border-0 rounded-3 mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split text-palette-gold fs-5"></i>
                Pending Leave Requests ({adminData.pendingLeaves.length})
              </h5>
              {onNavigate && (
                <button
                  type="button"
                  className="btn btn-sm btn-link text-decoration-none fw-semibold"
                  style={{ color: "#008A80" }}
                  onClick={() => onNavigate("leave")}
                >
                  View All Leaves &rarr;
                </button>
              )}
            </div>
            <div className="card-body p-0">
              {adminData.pendingLeaves.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-check2-circle fs-3 text-success d-block mb-1"></i>
                  No pending leave requests at this time.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Duration</th>
                        <th>Reason / Remarks</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.pendingLeaves.map((leave) => (
                        <tr key={leave._id}>
                          <td>
                            <div className="fw-bold text-palette-navy">
                              {leave.employee?.name || "Employee"}
                            </div>
                            <small className="text-muted">
                              {leave.employee?.employeeId || ""}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {leave.leaveType}
                            </span>
                          </td>
                          <td>
                            <small className="d-block text-dark fw-semibold">
                              {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                            </small>
                          </td>
                          <td>
                            <span className="small text-muted">{leave.remarks || "--"}</span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                type="button"
                                className="btn btn-success"
                                disabled={actionLoadingId === leave._id}
                                onClick={() => handleLeaveAction(leave._id, "Approved")}
                              >
                                {actionLoadingId === leave._id ? "..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-danger"
                                disabled={actionLoadingId === leave._id}
                                onClick={() => handleLeaveAction(leave._id, "Rejected")}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="row g-4">
            {/* Employee Directory */}
            <div className="col-12">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-header bg-white py-3">
                  <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                    <i className="bi bi-people text-palette-teal"></i>
                    Employee Directory ({adminData.employees.length})
                  </h5>
                </div>
                <div className="card-body p-0">
                  {adminData.employees.length === 0 ? (
                    <p className="p-4 text-center text-muted mb-0">No employees found.</p>
                  ) : (
                    <div className="table-responsive" style={{ maxHeight: "360px" }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.employees.map((emp) => (
                            <tr key={emp._id}>
                              <td>
                                <div className="fw-bold text-palette-navy">{emp.name}</div>
                                <small className="text-muted">
                                  {emp.employeeId} &bull; {emp.email}
                                </small>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {emp.role}
                                </span>
                              </td>
                              <td className="small text-muted">{emp.department || "General"}</td>
                              <td>
                                <span className="badge bg-success-subtle text-success">
                                  {emp.status || "Active"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================================== */
        /* EMPLOYEE VIEW */
        /* ==================================================================== */
        <>
          {/* Employee Stat & Today Check-in Cards */}
          <div className="row g-3 mb-4">
            {/* Today's Attendance Widget */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card card-stat card-stat-teal shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <small className="text-muted fw-semibold">TODAY'S ATTENDANCE</small>
                      <h5 className="fw-bold mb-0 mt-1 text-palette-navy">
                        {new Date().toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </h5>
                    </div>
                    <span
                      className={`badge ${
                        todayRecord?.checkOut
                          ? "bg-secondary text-white"
                          : todayRecord?.checkIn
                            ? "bg-success text-white"
                            : "bg-secondary-subtle text-secondary"
                      } px-2 py-1`}
                    >
                      {todayRecord?.checkOut
                        ? "Completed"
                        : todayRecord?.checkIn
                          ? "Present"
                          : "Not Checked In"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block">Check-in Time:</small>
                    <span className="fw-bold fs-5 text-palette-navy">
                      {todayRecord?.checkIn ? formatTime(todayRecord.checkIn) : "--:--"}
                    </span>
                  </div>

                  {!todayRecord ? (
                    <button
                      type="button"
                      className="btn btn-primary w-100 py-2.5 d-flex align-items-center justify-content-center gap-2"
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
                      className="btn btn-warning w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2"
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
                    <button type="button" className="btn btn-secondary w-100 py-2.5" disabled>
                      <i className="bi bi-check2-all me-1"></i> Session Completed
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Total Attendances */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card card-stat card-stat-green shadow-sm border-0 h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="p-3 rounded-3 fs-3 d-flex align-items-center justify-content-center"
                    style={{ backgroundColor: "rgba(73, 169, 115, 0.15)", color: "#389E4E", width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-calendar-check"></i>
                  </div>
                  <div>
                    <div className="text-muted small fw-semibold">DAYS LOGGED</div>
                    <div className="fs-3 fw-bold text-palette-navy">{employeeAttendance.length}</div>
                    <small className="text-muted">Total recorded sessions</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaves Overview */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card card-stat card-stat-gold shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="text-muted small fw-semibold mb-2">MY LEAVE REQUESTS</div>
                  <div className="d-flex gap-2">
                    <div className="flex-fill p-2 bg-light rounded text-center">
                      <div className="fw-bold fs-5 text-warning-emphasis">
                        {employeeLeaves.filter((l) => l.status === "Pending").length}
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        Pending
                      </small>
                    </div>
                    <div className="flex-fill p-2 bg-light rounded text-center">
                      <div className="fw-bold fs-5 text-success">
                        {employeeLeaves.filter((l) => l.status === "Approved").length}
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        Approved
                      </small>
                    </div>
                    <div className="flex-fill p-2 bg-light rounded text-center">
                      <div className="fw-bold fs-5 text-danger">
                        {employeeLeaves.filter((l) => l.status === "Rejected").length}
                      </div>
                      <small className="text-muted" style={{ fontSize: "11px" }}>
                        Rejected
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Recent Attendance Logs */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                    <i className="bi bi-clock-history text-palette-teal"></i>
                    My Attendance History
                  </h5>
                  {onNavigate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none fw-semibold"
                      style={{ color: "#008A80" }}
                      onClick={() => onNavigate("attendance")}
                    >
                      View All &rarr;
                    </button>
                  )}
                </div>
                <div className="card-body p-0">
                  {employeeAttendance.length === 0 ? (
                    <p className="p-4 text-center text-muted mb-0">No attendance logs yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Date</th>
                            <th>Check-In</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeAttendance.slice(0, 5).map((att) => (
                            <tr key={att._id}>
                              <td className="fw-semibold">{formatDate(att.date)}</td>
                              <td>{formatTime(att.checkIn)}</td>
                              <td>
                                <span className="badge bg-success-subtle text-success">
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Leave Requests */}
            <div className="col-12 col-lg-6">
              <div className="card shadow-sm border-0 rounded-3 h-100">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                    <i className="bi bi-file-earmark-text text-palette-gold"></i>
                    My Leave Requests
                  </h5>
                  {onNavigate && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-decoration-none fw-semibold"
                      style={{ color: "#008A80" }}
                      onClick={() => onNavigate("leave")}
                    >
                      Apply Leave &rarr;
                    </button>
                  )}
                </div>
                <div className="card-body p-0">
                  {employeeLeaves.length === 0 ? (
                    <p className="p-4 text-center text-muted mb-0">No leave requests submitted.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employeeLeaves.slice(0, 5).map((leave) => (
                            <tr key={leave._id}>
                              <td>
                                <span className="badge bg-light text-dark border">
                                  {leave.leaveType}
                                </span>
                              </td>
                              <td className="small">
                                {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    leave.status === "Approved"
                                      ? "bg-success-subtle text-success"
                                      : leave.status === "Rejected"
                                        ? "bg-danger-subtle text-danger"
                                        : "bg-warning-subtle text-warning-emphasis"
                                  }`}
                                >
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
