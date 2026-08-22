import React, { useEffect, useState } from "react";
const BACKEND_BASE = "http://localhost:5001";
const EMPLOYEE_ID = "EMP001";
const authHeaders = {
  "Content-Type": "application/json",
  "x-employee-id": EMPLOYEE_ID
};
function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Profile Edit states
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // 1. Verify backend status
      const statusRes = await fetch(`${BACKEND_BASE}/`);
      if (statusRes.ok) {
        setBackendStatus("Backend Connected");
      } else {
        setBackendStatus("Backend Disconnected");
      }

      // 2. Fetch Employee Profile from backend
      const profileRes = await fetch(`${BACKEND_BASE}/api/employee/profile`, {
        headers: authHeaders
      });

      if (profileRes.ok) {
        const result = await profileRes.json();
        if (result.success && result.data) {
          setProfile(result.data);
          setEditPhone(result.data.phone || "");
          setEditAddress(result.data.address || "");
        }
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
      setBackendStatus("Backend Disconnected");
    } finally {
      setLoading(false);
    }
  }

  function showMessage(type, text) {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  }

  // Handle Contact details update
  async function handleSaveProfile(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/employee/profile`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          phone: editPhone,
          address: editAddress
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setIsEditingProfile(false);
        showMessage("success", "Contact details updated successfully.");
      } else {
        showMessage("error", data.message || "Failed to update profile.");
      }
    } catch (err) {
      showMessage("error", "Network error updating profile.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Photo URL update
  async function handleSavePhoto(e) {
    e.preventDefault();
    if (!photoUrlInput.trim()) {
      showMessage("error", "Please provide a valid image URL.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/employee/profile/photo`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          photoUrl: photoUrlInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          profilePicture: photoUrlInput.trim()
        }));
        setIsEditingPhoto(false);
        setPhotoUrlInput("");
        showMessage("success", "Profile picture updated successfully.");
      } else {
        showMessage("error", data.message || "Failed to update photo.");
      }
    } catch (err) {
      showMessage("error", "Network error updating photo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Bootstrap Navbar */}
      <nav className="navbar navbar-expand navbar-dark bg-primary px-3 shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold mb-0 fs-5">DAYFLOW</span>

          <div className="navbar-nav me-auto ms-3">
            <button
              className={`nav-link btn btn-link text-white text-decoration-none px-3 ${
                activeTab === "dashboard"
                  ? "fw-bold border-bottom border-2 border-white active"
                  : "opacity-75"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-link btn btn-link text-white text-decoration-none px-3 ${
                activeTab === "profile"
                  ? "fw-bold border-bottom border-2 border-white active"
                  : "opacity-75"
              }`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
          </div>

          <div>
            <span
              className={`badge ${
                backendStatus === "Backend Connected"
                  ? "bg-success text-white"
                  : "bg-danger text-white"
              } px-3 py-2`}
            >
              ● {backendStatus}
            </span>
          </div>
        </div>
      </nav>

      {/* Alert Notification */}
      {actionMessage && (
        <div className="container mt-3">
          <div
            className={`alert ${
              actionMessage.type === "success" ? "alert-success" : "alert-danger"
            } alert-dismissible fade show shadow-sm mb-0`}
            role="alert"
          >
            {actionMessage.text}
            <button
              type="button"
              className="btn-close"
              onClick={() => setActionMessage(null)}
              aria-label="Close"
            ></button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container my-4 flex-grow-1">
        {loading && !profile ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="mb-0">Loading employee data...</p>
          </div>
        ) : (
          <>
            {/* SECTION 1: DASHBOARD */}
            {activeTab === "dashboard" && (
              <section>
                {/* Welcome Card */}
                <div className="card mb-4 border-0 shadow-sm bg-white">
                  <div className="card-body p-4 border-start border-primary border-4 rounded-start">
                    <h2 className="h4 fw-bold text-dark mb-1">
                      Welcome, {profile?.name || "Employee"}
                    </h2>
                    <p className="text-muted mb-0">
                      {profile?.designation || "Senior Software Engineer"} &bull;{" "}
                      {profile?.department || "Engineering"} Department
                    </p>
                  </div>
                </div>

                {/* Summary Cards Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="card text-center shadow-sm h-100 border-0 bg-white">
                      <div className="card-body p-3">
                        <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                          Employee ID
                        </small>
                        <h5 className="fw-bold mb-0 text-dark">
                          {profile?.employeeId || EMPLOYEE_ID}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="card text-center shadow-sm h-100 border-0 bg-white">
                      <div className="card-body p-3">
                        <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                          Department
                        </small>
                        <h5 className="fw-bold mb-0 text-dark">
                          {profile?.department || "Engineering"}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="card text-center shadow-sm h-100 border-0 bg-white">
                      <div className="card-body p-3">
                        <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                          Designation
                        </small>
                        <h5 className="fw-bold mb-0 text-dark">
                          {profile?.designation || "Senior Software Engineer"}
                        </h5>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-sm-6 col-md-3">
                    <div className="card text-center shadow-sm h-100 border-0 bg-white">
                      <div className="card-body p-3">
                        <small className="text-muted text-uppercase fw-semibold d-block mb-1">
                          Status
                        </small>
                        <span className="badge bg-success fs-6">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Basic Employee Information Card */}
                <div className="card shadow-sm border-0 bg-white">
                  <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
                    <h3 className="h6 fw-bold mb-0 text-dark">Employee Overview</h3>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setActiveTab("profile")}
                    >
                      View Full Profile
                    </button>
                  </div>

                  <div className="card-body p-0">
                    <table className="table table-bordered mb-0">
                      <tbody>
                        <tr>
                          <th className="bg-light w-25 text-secondary">Full Name</th>
                          <td className="text-dark">{profile?.name || "Employee User"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Employee ID</th>
                          <td className="text-dark">{profile?.employeeId || EMPLOYEE_ID}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Email Address</th>
                          <td className="text-dark">{profile?.email || "employee@example.com"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Phone Number</th>
                          <td className="text-dark">{profile?.phone || "+1 (555) 234-5678"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Department</th>
                          <td className="text-dark">{profile?.department || "Engineering"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Designation</th>
                          <td className="text-dark">
                            {profile?.designation || "Senior Software Engineer"}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light text-secondary">Joining Date</th>
                          <td className="text-dark">{profile?.joiningDate || "2023-03-15"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 2: PROFILE */}
            {activeTab === "profile" && (
              <section>
                {/* Profile Header Card */}
                <div className="card shadow-sm border-0 bg-white mb-4">
                  <div className="card-body d-flex flex-column flex-sm-row align-items-center gap-3 p-4">
                    <div className="text-center">
                      <img
                        src={
                          profile?.profilePicture ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
                        }
                        alt={profile?.name}
                        className="rounded-circle border"
                        style={{ width: "90px", height: "90px", objectFit: "cover" }}
                      />
                      <div className="mt-2">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                        >
                          {isEditingPhoto ? "Close" : "Change Photo"}
                        </button>
                      </div>
                    </div>

                    <div className="ms-sm-3 text-center text-sm-start">
                      <h2 className="h4 fw-bold mb-1 text-dark">{profile?.name}</h2>
                      <p className="text-muted mb-2">
                        {profile?.designation} &bull; {profile?.department}
                      </p>
                      <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-sm-start">
                        <span className="badge bg-light text-dark border">
                          ID: {profile?.employeeId}
                        </span>
                        <span className="badge bg-light text-dark border">
                          Joined: {profile?.joiningDate}
                        </span>
                        <span className="badge bg-light text-dark border">
                          Role: {profile?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Change Photo URL Form */}
                {isEditingPhoto && (
                  <div className="card shadow-sm border-0 bg-white mb-4">
                    <div className="card-body p-4">
                      <h5 className="card-title h6 fw-bold mb-3 text-dark">
                        Update Profile Picture URL
                      </h5>
                      <form onSubmit={handleSavePhoto} className="row g-2">
                        <div className="col-12 col-sm-8">
                          <input
                            type="url"
                            placeholder="Enter image URL (e.g. https://images.unsplash.com/...)"
                            value={photoUrlInput}
                            onChange={(e) => setPhotoUrlInput(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="col-12 col-sm-4 d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                          >
                            Save Photo
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setIsEditingPhoto(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Profile Details & Edit Section */}
                <div className="row g-4">
                  {/* Contact Information */}
                  <div className="col-12 col-md-6">
                    <div className="card shadow-sm border-0 bg-white h-100">
                      <div className="card-header bg-white d-flex justify-content-between align-items-center py-3 border-bottom">
                        <h3 className="h6 fw-bold mb-0 text-dark">Contact Information</h3>
                        {!isEditingProfile && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setIsEditingProfile(true)}
                          >
                            Edit Contact
                          </button>
                        )}
                      </div>

                      <div className="card-body p-4">
                        {isEditingProfile ? (
                          <form onSubmit={handleSaveProfile}>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold text-secondary">
                                Email Address (Read-only)
                              </label>
                              <input
                                type="text"
                                value={profile?.email || ""}
                                disabled
                                className="form-control bg-light"
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold text-secondary">
                                Phone Number
                              </label>
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                className="form-control"
                                required
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label small fw-semibold text-secondary">
                                Residential Address
                              </label>
                              <textarea
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value)}
                                className="form-control"
                                rows="3"
                                required
                              />
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                disabled={isSubmitting}
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setIsEditingProfile(false);
                                  setEditPhone(profile?.phone || "");
                                  setEditAddress(profile?.address || "");
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
                                <th className="text-secondary w-25 ps-0">Email:</th>
                                <td className="text-dark">{profile?.email}</td>
                              </tr>
                              <tr>
                                <th className="text-secondary ps-0">Phone:</th>
                                <td className="text-dark">{profile?.phone}</td>
                              </tr>
                              <tr>
                                <th className="text-secondary ps-0">Address:</th>
                                <td className="text-dark">{profile?.address}</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Compensation & Documents */}
                  <div className="col-12 col-md-6">
                    <div className="card shadow-sm border-0 bg-white h-100">
                      <div className="card-header bg-white py-3 border-bottom">
                        <h3 className="h6 fw-bold mb-0 text-dark">Salary & Documents</h3>
                      </div>

                      <div className="card-body p-4">
                        <h6 className="fw-bold text-secondary small text-uppercase mb-2">
                          Compensation Overview
                        </h6>
                        <table className="table table-sm table-borderless mb-3">
                          <tbody>
                            <tr>
                              <td className="text-muted ps-0">Basic Salary</td>
                              <td className="text-end fw-semibold text-dark">
                                ${profile?.salary?.basic?.toLocaleString() || "6,500"}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted ps-0">Allowances</td>
                              <td className="text-end text-success fw-semibold">
                                +${profile?.salary?.allowances?.toLocaleString() || "1,200"}
                              </td>
                            </tr>
                            <tr>
                              <td className="text-muted ps-0">Deductions</td>
                              <td className="text-end text-danger fw-semibold">
                                -${profile?.salary?.deductions?.toLocaleString() || "450"}
                              </td>
                            </tr>
                            <tr className="border-top">
                              <td className="fw-bold ps-0 text-dark">Net Monthly Salary</td>
                              <td className="text-end fw-bold text-primary">
                                ${profile?.salary?.netSalary?.toLocaleString() || "7,250"}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <h6 className="fw-bold text-secondary small text-uppercase mb-2 mt-4">
                          Verified Documents
                        </h6>
                        <div className="list-group list-group-flush">
                          {profile?.documents?.map((doc) => (
                            <div
                              key={doc.id}
                              className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom"
                            >
                              <div>
                                <div className="small fw-semibold text-dark">{doc.name}</div>
                                <small className="text-muted">{doc.type}</small>
                              </div>
                              <span className="badge bg-success">Verified</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
