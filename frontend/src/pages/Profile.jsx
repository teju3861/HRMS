import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { authApi, attendanceApi, healthApi } from "../services/api";

const verifiedDocuments = [
  { id: 1, name: "Employment Agreement", type: "Official Contract", status: "Verified" },
  { id: 2, name: "Government ID Proof", type: "Identity Verification", status: "Verified" },
  { id: 3, name: "Educational Certificates", type: "Academic Verification", status: "Verified" },
];

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

function formatDate(dateValue) {
  if (!dateValue) return "Not available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "--:--";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Profile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // Editable fields state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name || "");
  const [editPhone, setEditPhone] = useState(profile.phone || "");
  const [editAddress, setEditAddress] = useState(profile.address || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Attendance state
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);
    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const loadProfileData = async () => {
    setLoading(true);

    try {
      try {
        const health = await healthApi.checkHealth();
        setBackendStatus(health ? "Backend Connected" : "Backend Disconnected");
      } catch {
        setBackendStatus("Backend Disconnected");
      }

      const meData = await authApi.getMe();
      if (meData && meData.user) {
        setProfile(meData.user);
        setEditName(meData.user.name || "");
        setEditPhone(meData.user.phone || "");
        setEditAddress(meData.user.address || "");
      } else if (user) {
        setProfile(user);
        setEditName(user.name || "");
        setEditPhone(user.phone || "");
        setEditAddress(user.address || "");
      }

      const attendanceData = await attendanceApi.getAttendance();
      const list = Array.isArray(attendanceData) ? attendanceData : [];
      setAttendanceHistory(list);

      const today = new Date();
      const todayMatch = list.find((rec) => isSameDay(rec.date, today));
      setTodayAttendance(todayMatch || null);
    } catch (error) {
      showMessage("danger", error.message || "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleSaveContactInfo = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const result = await authApi.updateProfile({
        name: editName,
        phone: editPhone,
        address: editAddress,
      });
      if (result && result.user) {
        setProfile(result.user);
      } else {
        setProfile((prev) => ({ ...prev, name: editName, phone: editPhone, address: editAddress }));
      }
      setIsEditing(false);
      refreshUser();
      showMessage("success", "Profile details updated successfully!");
    } catch (err) {
      showMessage("danger", err.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const result = await attendanceApi.checkIn();
      setTodayAttendance(result);
      showMessage("success", "Checked in successfully for today!");
      loadProfileData();
    } catch (err) {
      showMessage("danger", err.message || "Failed to check in.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const result = await attendanceApi.checkOut();
      setTodayAttendance(result);
      showMessage("success", "Checked out successfully for today!");
      loadProfileData();
    } catch (err) {
      showMessage("danger", err.message || "Failed to check out.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-palette-teal mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mb-0">Loading employee profile...</p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1 section-title">Profile Management</h2>
          <p className="text-muted mb-0 mt-1">
            View and manage your verified organization profile, personal details, and attendance session logs.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            onClick={loadProfileData}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div className={`alert alert-${messageType} alert-dismissible fade show mb-4`} role="alert">
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
            aria-label="Close"
          />
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="card shadow-sm border-0 rounded-3 mb-4 overflow-hidden">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            {/* Avatar Placeholder with Gold Accent */}
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-2 shadow-sm"
              style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#F4D14F",
                color: "#2F4858",
                border: "3px solid #116976",
              }}
            >
              {getInitials(profile.name)}
            </div>

            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h3 className="h4 fw-bold mb-0 text-palette-navy">{profile.name || "User Profile"}</h3>
                <span className="badge bg-success-subtle text-success">
                  {profile.status || "Active"}
                </span>
                <span className="badge bg-palette-gold text-palette-navy fw-bold">
                  {profile.role === "Admin" ? "Manager" : profile.role || "Employee"}
                </span>
              </div>
              <p className="text-muted mb-0">
                {profile.designation || "Staff"} &bull; {profile.department || "General"}
              </p>
            </div>
          </div>

          <hr className="my-4" />

          <div className="row g-3">
            <div className="col-6 col-md-3">
              <small className="text-muted d-block">Employee ID</small>
              <strong className="text-palette-navy">{profile.employeeId || "--"}</strong>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted d-block">Work Email</small>
              <strong className="text-palette-navy text-break">{profile.email || "--"}</strong>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted d-block">Department</small>
              <strong className="text-palette-navy">{profile.department || "General"}</strong>
            </div>
            <div className="col-6 col-md-3">
              <small className="text-muted d-block">Joining Date</small>
              <strong className="text-palette-navy">{formatDate(profile.joiningDate || profile.createdAt)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Contact & Personal Information */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                <i className="bi bi-person-lines-fill text-palette-teal"></i>
                Personal & Contact Information
              </h5>

              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil me-1"></i> Edit Profile
                </button>
              )}
            </div>

            <div className="card-body">
              {isEditing ? (
                <form onSubmit={handleSaveContactInfo}>
                  <div className="mb-3">
                    <label htmlFor="editName" className="form-label fw-semibold text-palette-navy small">
                      Full Name
                    </label>
                    <input
                      id="editName"
                      type="text"
                      className="form-control"
                      placeholder="Enter your full name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editPhone" className="form-label fw-semibold text-palette-navy small">
                      Phone Number
                    </label>
                    <input
                      id="editPhone"
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="editAddress" className="form-label fw-semibold text-palette-navy small">
                      Residential Address
                    </label>
                    <textarea
                      id="editAddress"
                      className="form-control"
                      rows="3"
                      placeholder="Enter street address, city, state..."
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-3 fw-bold"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm px-3"
                      onClick={() => {
                        setEditName(profile.name || "");
                        setEditPhone(profile.phone || "");
                        setEditAddress(profile.address || "");
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <th className="text-muted ps-0" style={{ width: "120px" }}>
                        Full Name
                      </th>
                      <td className="fw-semibold text-palette-navy">{profile.name}</td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Work Email</th>
                      <td className="fw-semibold text-palette-navy">{profile.email}</td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Account Role</th>
                      <td>
                        <span className="badge bg-palette-gold text-palette-navy fw-bold">
                          {profile.role === "Admin" ? "Manager" : profile.role}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Phone</th>
                      <td className="text-palette-navy fw-medium">{profile.phone || "Not provided (Click Edit)"}</td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Address</th>
                      <td className="text-palette-navy fw-medium">{profile.address || "Not provided (Click Edit)"}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Verified Documents */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 rounded-3 h-100">
            <div className="card-header bg-white py-3">
              <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
                <i className="bi bi-file-earmark-check text-palette-teal"></i>
                Verified Documents
              </h5>
            </div>

            <div className="card-body">
              <div className="list-group list-group-flush">
                {verifiedDocuments.map((doc) => (
                  <div
                    className="list-group-item d-flex justify-content-between align-items-center px-0 py-2"
                    key={doc.id}
                  >
                    <div>
                      <strong className="d-block text-palette-navy small">{doc.name}</strong>
                      <small className="text-muted">{doc.type}</small>
                    </div>
                    <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1">
                      <i className="bi bi-check-circle-fill"></i> {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Session (Check In & Check Out) */}
      <div className="card shadow-sm border-0 rounded-3 mb-4">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
            <i className="bi bi-clock text-palette-teal"></i>
            Today's Attendance Session
          </h5>
          <span className="text-muted small">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="card-body">
          <div className="row g-3 mb-3 align-items-center">
            <div className="col-md-3">
              <small className="text-muted d-block">Today's Status</small>
              <span
                className={`badge ${
                  todayAttendance?.checkOut
                    ? "bg-secondary"
                    : todayAttendance?.checkIn
                      ? "bg-success"
                      : "bg-secondary"
                } fs-6 px-3 py-1 mt-1`}
              >
                {todayAttendance?.checkOut
                  ? "Completed (Checked Out)"
                  : todayAttendance?.checkIn
                    ? "Present (Checked In)"
                    : "Not Checked In"}
              </span>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Check-In Time</small>
              <strong className="fs-6 text-palette-navy">
                {todayAttendance?.checkIn ? formatTime(todayAttendance.checkIn) : "--:--"}
              </strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Check-Out Time</small>
              <strong className="fs-6 text-palette-navy">
                {todayAttendance?.checkOut ? formatTime(todayAttendance.checkOut) : "--:--"}
              </strong>
            </div>
            <div className="col-md-3">
              {!todayAttendance ? (
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  onClick={handleCheckIn}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i> Check In
                    </>
                  )}
                </button>
              ) : !todayAttendance.checkOut ? (
                <button
                  type="button"
                  className="btn btn-warning w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2"
                  onClick={handleCheckOut}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right"></i> Check Out
                    </>
                  )}
                </button>
              ) : (
                <button type="button" className="btn btn-secondary w-100 py-2" disabled>
                  <i className="bi bi-check2-all me-1"></i> Session Finished
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white py-3">
          <h5 className="card-title fw-bold mb-0 text-palette-navy d-flex align-items-center gap-2">
            <i className="bi bi-calendar3 text-palette-teal"></i>
            Recent Attendance History ({attendanceHistory.length})
          </h5>
        </div>

        <div className="card-body p-0">
          {attendanceHistory.length === 0 ? (
            <p className="p-4 text-center text-muted mb-0">No attendance history records found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Check In Time</th>
                    <th>Check Out Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.slice(0, 10).map((item) => (
                    <tr key={item._id}>
                      <td className="fw-semibold">{formatDate(item.date)}</td>
                      <td>{formatTime(item.checkIn)}</td>
                      <td>{formatTime(item.checkOut)}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === "Present"
                              ? "bg-success-subtle text-success"
                              : "bg-warning-subtle text-warning-emphasis"
                          }`}
                        >
                          {item.status}
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
  );
}

export default Profile;
