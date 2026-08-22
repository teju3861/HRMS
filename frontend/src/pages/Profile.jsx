import { useEffect, useState } from "react";

const API_URL = "http://localhost:5001";

const sampleProfile = {
  employeeId: "EMP001",
  name: "Employee User",
  email: "employee@example.com",
  phone: "+1 (555) 234-5678",
  address: "123 Business Street, New York",
  department: "Engineering",
  designation: "Senior Software Engineer",
  joiningDate: "2023-03-15",
  role: "Employee",
  status: "Active",
};

const sampleDocuments = [
  { id: 1, name: "Identity Proof", type: "Government ID" },
  { id: 2, name: "Address Proof", type: "Utility Bill" },
  { id: 3, name: "Education Certificate", type: "Degree" },
];

const sampleAttendance = [
  {
    id: 1,
    date: "2026-08-21",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    workingHours: "8h 30m",
    status: "Present",
  },
  {
    id: 2,
    date: "2026-08-20",
    checkIn: "09:05 AM",
    checkOut: "05:45 PM",
    workingHours: "8h 40m",
    status: "Present",
  },
  {
    id: 3,
    date: "2026-08-19",
    checkIn: "09:15 AM",
    checkOut: "01:30 PM",
    workingHours: "4h 15m",
    status: "Half-day",
  },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getCurrentTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getWorkingHours(checkIn, checkOut) {
  const today = getTodayDate();
  const startTime = new Date(`${today} ${checkIn}`);
  const endTime = new Date(`${today} ${checkOut}`);

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return "--";
  }

  const totalMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} mins`;
  }

  return `${hours}h ${minutes}m`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "Not available";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Profile() {
  const [profile, setProfile] = useState(sampleProfile);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(sampleProfile.phone);
  const [address, setAddress] = useState(sampleProfile.address);

  const [todayAttendance, setTodayAttendance] = useState({
    date: getTodayDate(),
    checkIn: "--",
    checkOut: "--",
    workingHours: "--",
    status: "Not Checked In",
  });
  const [attendanceHistory, setAttendanceHistory] = useState(sampleAttendance);

  useEffect(() => {
    loadProfile();
  }, []);

  const showMessage = (type, text) => {
    setMessageType(type);
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const loadProfile = async () => {
    setLoading(true);

    try {
      const healthResponse = await fetch(`${API_URL}/api/health`);
      setBackendStatus(
        healthResponse.ok ? "Backend Connected" : "Backend Disconnected",
      );

      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user || data.data || {};

        setProfile((prev) => ({ ...prev, ...user }));
        setPhone(user.phone || sampleProfile.phone);
        setAddress(user.address || sampleProfile.address);
      }
    } catch (error) {
      setBackendStatus("Backend Disconnected");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch(`${API_URL}/api/employee/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone, address }),
        });
      }

      setProfile((prev) => ({
        ...prev,
        phone,
        address,
      }));

      setIsEditing(false);
      showMessage("success", "Contact details updated successfully.");
    } catch (err) {
      showMessage("danger", "Failed to update profile details.");
    }
  };

  const handleCancelEdit = () => {
    setPhone(profile.phone || "");
    setAddress(profile.address || "");
    setIsEditing(false);
  };

  const handleCheckIn = () => {
    if (todayAttendance.checkIn !== "--") {
      showMessage("danger", "You have already checked in today.");
      return;
    }

    const currentTime = getCurrentTime();

    setTodayAttendance({
      ...todayAttendance,
      checkIn: currentTime,
      status: "Checked In",
    });

    showMessage("success", `Checked in at ${currentTime}.`);
  };

  const handleCheckOut = () => {
    if (todayAttendance.checkIn === "--") {
      showMessage("danger", "Please check in before checking out.");
      return;
    }

    if (todayAttendance.checkOut !== "--") {
      showMessage("danger", "You have already checked out today.");
      return;
    }

    const currentTime = getCurrentTime();
    const totalHours = getWorkingHours(todayAttendance.checkIn, currentTime);
    const newRecord = {
      id: Date.now(),
      date: getTodayDate(),
      checkIn: todayAttendance.checkIn,
      checkOut: currentTime,
      workingHours: totalHours,
      status: "Present",
    };

    setTodayAttendance({
      ...todayAttendance,
      checkOut: currentTime,
      workingHours: totalHours,
      status: "Present",
    });

    setAttendanceHistory([
      newRecord,
      ...attendanceHistory.filter((item) => item.date !== getTodayDate()),
    ]);

    showMessage("success", `Checked out at ${currentTime}.`);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mb-0">Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h2 className="h4 fw-bold mb-1">Employee Profile</h2>
          <p className="text-muted mb-0">
            View profile details and daily attendance.
          </p>
        </div>

        <span
          className={`badge ${
            backendStatus === "Backend Connected" ? "bg-success" : "bg-danger"
          } px-3 py-2`}
        >
          {backendStatus}
        </span>
      </div>

      {message && (
        <div
          className={`alert alert-${messageType} alert-dismissible fade show`}
        >
          {message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage("")}
            aria-label="Close"
          />
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h3 className="h4 fw-bold mb-1">{profile.name}</h3>
              <p className="text-muted mb-3">
                {profile.designation} &bull; {profile.department}
              </p>
            </div>

            <span className="badge bg-success">{profile.status}</span>
          </div>

          <div className="row g-3">
            <div className="col-md-3">
              <small className="text-muted d-block">Employee ID</small>
              <strong>{profile.employeeId}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Role</small>
              <strong>{profile.role}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Department</small>
              <strong>{profile.department}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Joining Date</small>
              <strong>{formatDate(profile.joiningDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h3 className="h6 fw-bold mb-0">Contact Information</h3>

              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>

            <div className="card-body">
              {isEditing ? (
                <form onSubmit={handleSaveProfile}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      className="form-control"
                      value={profile.email || ""}
                      disabled
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="form-control"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                      Address
                    </label>
                    <textarea
                      id="address"
                      className="form-control"
                      rows="3"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      required
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary btn-sm">
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <th className="text-muted ps-0">Email</th>
                      <td>{profile.email}</td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Phone</th>
                      <td>{profile.phone || "Not available"}</td>
                    </tr>
                    <tr>
                      <th className="text-muted ps-0">Address</th>
                      <td>{profile.address || "Not available"}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white">
              <h3 className="h6 fw-bold mb-0">Verified Documents</h3>
            </div>

            <div className="card-body">
              <div className="list-group list-group-flush">
                {sampleDocuments.map((document) => (
                  <div
                    className="list-group-item d-flex justify-content-between align-items-center px-0"
                    key={document.id}
                  >
                    <div>
                      <strong className="d-block">{document.name}</strong>
                      <small className="text-muted">{document.type}</small>
                    </div>
                    <span className="badge bg-success">Verified</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h3 className="h6 fw-bold mb-0">Today's Attendance</h3>
          <span className="text-muted small">{todayAttendance.date}</span>
        </div>

        <div className="card-body">
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <small className="text-muted d-block">Status</small>
              <span
                className={`badge ${
                  todayAttendance.status === "Present"
                    ? "bg-success"
                    : todayAttendance.status === "Checked In"
                      ? "bg-primary"
                      : "bg-secondary"
                }`}
              >
                {todayAttendance.status}
              </span>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Check In</small>
              <strong>{todayAttendance.checkIn}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Check Out</small>
              <strong>{todayAttendance.checkOut}</strong>
            </div>
            <div className="col-md-3">
              <small className="text-muted d-block">Working Hours</small>
              <strong>{todayAttendance.workingHours}</strong>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleCheckIn}
              disabled={todayAttendance.checkIn !== "--"}
            >
              Check In
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleCheckOut}
              disabled={
                todayAttendance.checkIn === "--" ||
                todayAttendance.checkOut !== "--"
              }
            >
              Check Out
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white">
          <h3 className="h6 fw-bold mb-0">Attendance History</h3>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.checkIn}</td>
                  <td>{item.checkOut}</td>
                  <td>{item.workingHours}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.status === "Present"
                          ? "bg-success"
                          : "bg-warning text-dark"
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
      </div>
    </div>
  );
}

export default Profile;
