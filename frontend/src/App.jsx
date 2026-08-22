import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import ApplyLeave from "./pages/ApplyLeave";
import Profile from "./pages/Profile";

function AppContent() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [authTab, setAuthTab] = useState("login");

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-palette-teal mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading Dayflow HRMS...</span>
        </div>
        <h5 className="fw-bold text-palette-navy">Loading Dayflow HRMS...</h5>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "#F3F7F6" }}>
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
        <div className="container">
          <a
            className="navbar-brand fw-bold d-flex align-items-center gap-2"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (isAuthenticated) setTab("dashboard");
            }}
          >
            <div className="brand-icon-box">
              <i className="bi bi-building-fill-check"></i>
            </div>
            <span className="fs-5 text-white fw-bold">Dayflow HRMS</span>
          </a>

          {isAuthenticated ? (
            <div className="d-flex align-items-center flex-wrap gap-2 ms-auto">
              {/* Navigation Links */}
              <div className="d-flex gap-1 me-2 flex-wrap">
                <button
                  type="button"
                  className={`btn nav-pill-btn ${
                    tab === "dashboard" ? "active" : "btn-outline-light border-0"
                  } d-flex align-items-center gap-1`}
                  onClick={() => setTab("dashboard")}
                >
                  <i className="bi bi-speedometer2"></i>
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  className={`btn nav-pill-btn ${
                    tab === "attendance" ? "active" : "btn-outline-light border-0"
                  } d-flex align-items-center gap-1`}
                  onClick={() => setTab("attendance")}
                >
                  <i className="bi bi-calendar-check"></i>
                  <span>Attendance</span>
                </button>

                <button
                  type="button"
                  className={`btn nav-pill-btn ${
                    tab === "leave" ? "active" : "btn-outline-light border-0"
                  } d-flex align-items-center gap-1`}
                  onClick={() => setTab("leave")}
                >
                  <i className="bi bi-file-earmark-text"></i>
                  <span>Leaves</span>
                </button>

                <button
                  type="button"
                  className={`btn nav-pill-btn ${
                    tab === "profile" ? "active" : "btn-outline-light border-0"
                  } d-flex align-items-center gap-1`}
                  onClick={() => setTab("profile")}
                >
                  <i className="bi bi-person-circle"></i>
                  <span>Profile</span>
                </button>
              </div>

              {/* User Info & Logout */}
              <div className="d-flex align-items-center gap-2 border-start ps-3 border-white-50">
                <div className="text-end d-none d-sm-block">
                  <div className="small fw-bold text-white lh-1">{user?.name}</div>
                  <span className="user-role-tag d-inline-block mt-1">
                    {user?.role === "Admin" ? "Manager" : user?.role}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-light border-0 d-flex align-items-center gap-1 ms-1"
                  onClick={() => {
                    logout();
                    setAuthTab("login");
                  }}
                  title="Sign Out"
                >
                  <i className="bi bi-box-arrow-right fs-6"></i>
                  <span className="d-none d-md-inline small fw-semibold">Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex gap-2 ms-auto">
              <button
                type="button"
                className={`btn nav-pill-btn ${
                  authTab === "login" ? "active" : "btn-outline-light border-0"
                }`}
                onClick={() => setAuthTab("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`btn nav-pill-btn ${
                  authTab === "admin" ? "active bg-warning text-dark" : "btn-outline-warning"
                } fw-bold`}
                onClick={() => setAuthTab("admin")}
              >
                <i className="bi bi-shield-lock-fill me-1"></i> Manager Portal
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="container py-4 flex-grow-1">
        {isAuthenticated ? (
          <>
            {tab === "dashboard" && <Dashboard onNavigate={setTab} />}
            {tab === "attendance" && <Attendance />}
            {tab === "leave" && <ApplyLeave />}
            {tab === "profile" && <Profile />}
          </>
        ) : (
          <>
            {authTab === "login" && (
              <Login
                onSwitchToAdmin={() => setAuthTab("admin")}
                onLoginSuccess={() => setTab("dashboard")}
              />
            )}
            {authTab === "admin" && (
              <AdminLogin
                onLoginSuccess={() => setTab("dashboard")}
                onSwitchToGeneralLogin={() => setAuthTab("login")}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 bg-white border-top mt-auto text-center text-muted small">
        <div className="container">
          &copy; {new Date().getFullYear()} Dayflow HRMS &bull; Human Resource Management System
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
