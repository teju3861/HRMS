import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Login({ onSwitchToAdmin, onLoginSuccess }) {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage("Please enter both work email and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await login(formData.email.trim(), formData.password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: "480px" }}>
      <div className="card shadow border-0 rounded-4 overflow-hidden">
        {/* Card Header with Palette Gradient */}
        <div
          className="card-header p-4 text-center text-white"
          style={{
            background: "linear-gradient(135deg, #2F4858 0%, #116976 50%, #008A80 100%)",
            borderBottom: "4px solid #F4D14F",
          }}
        >
          <div
            className="d-inline-flex p-3 rounded-circle mb-2 shadow-sm"
            style={{ backgroundColor: "#F4D14F", color: "#2F4858" }}
          >
            <i className="bi bi-person-badge fs-2"></i>
          </div>
          <h3 className="fw-bold mb-1 text-white">Welcome to Dayflow</h3>
          <p className="mb-0 text-white-50 small">
            Sign in to access your HR workspace
          </p>
        </div>

        <div className="card-body p-4 p-md-5">
          {errorMessage && (
            <div
              className="alert alert-danger alert-dismissible fade show d-flex align-items-center gap-2"
              role="alert"
            >
              <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <div>{errorMessage}</div>
              <button
                type="button"
                className="btn-close ms-auto"
                onClick={() => setErrorMessage("")}
                aria-label="Close"
              ></button>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Email Field */}
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label fw-semibold text-palette-navy">
                Work Email
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope text-palette-teal"></i>
                </span>
                <input
                  id="loginEmail"
                  type="email"
                  name="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label htmlFor="loginPassword" className="form-label fw-semibold text-palette-navy">
                Password
              </label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-palette-teal"></i>
                </span>
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control border-start-0 border-end-0 ps-0"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Dedicated Admin Portal Switcher */}
          {onSwitchToAdmin && (
            <div className="text-center mt-3 pt-3 border-top">
              <button
                type="button"
                className="btn btn-sm btn-outline-warning text-dark fw-bold rounded-pill px-3"
                onClick={onSwitchToAdmin}
              >
                <i className="bi bi-shield-lock-fill me-1"></i> Manager Portal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
