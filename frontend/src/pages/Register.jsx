import { useState } from "react";

function Register() {
  const [formData, setFormData] = useState({
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Employee",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordRules = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[^A-Za-z0-9]/.test(formData.password),
  };

  const strongPassword = Object.values(passwordRules).every(Boolean);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (!formData.employeeId) {
      return;
    }

    if (!formData.email) {
      return;
    }

    if (!strongPassword) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    console.log("Registration Data:", formData);

    alert("Account details validated successfully!");
  };

  return (
    <div className="register-page">

      <div className="register-section">

        <div className="register-card">

          <div className="form-heading">
            <h2>Create your account</h2>

            <p>
              Join Dayflow and get started with your HR workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            {/* EMPLOYEE ID */}
            <div className="form-group">

              <label htmlFor="employeeId">
                Employee ID
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ID
                </span>

                <input
                  id="employeeId"
                  type="text"
                  name="employeeId"
                  placeholder="Enter your employee ID"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />

              </div>

              {submitted && !formData.employeeId && (
                <small className="error-message">
                  Employee ID is required.
                </small>
              )}

            </div>


            {/* EMAIL */}
            <div className="form-group">

              <label htmlFor="email">
                Work Email
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />

              </div>

              {submitted && !formData.email && (
                <small className="error-message">
                  Email address is required.
                </small>
              )}

            </div>


            {/* PASSWORD */}
            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ••
                </span>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>


              {/* PASSWORD REQUIREMENTS */}
              <div className="password-rules">

                <div className="rules-title">
                  Password requirements
                </div>

                <div className="rules-grid">

                  <span
                    className={
                      passwordRules.length ? "valid" : ""
                    }
                  >
                    {passwordRules.length ? "✓" : "○"}{" "}
                    8+ characters
                  </span>

                  <span
                    className={
                      passwordRules.uppercase ? "valid" : ""
                    }
                  >
                    {passwordRules.uppercase ? "✓" : "○"}{" "}
                    Uppercase
                  </span>

                  <span
                    className={
                      passwordRules.lowercase ? "valid" : ""
                    }
                  >
                    {passwordRules.lowercase ? "✓" : "○"}{" "}
                    Lowercase
                  </span>

                  <span
                    className={
                      passwordRules.number ? "valid" : ""
                    }
                  >
                    {passwordRules.number ? "✓" : "○"}{" "}
                    Number
                  </span>

                  <span
                    className={
                      passwordRules.special ? "valid" : ""
                    }
                  >
                    {passwordRules.special ? "✓" : "○"}{" "}
                    Special character
                  </span>

                </div>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}
            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ••
                </span>

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="show-password"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>


              {/* PASSWORD MATCH MESSAGE */}
              {formData.confirmPassword &&
                formData.password !==
                  formData.confirmPassword && (
                  <small className="error-message">
                    Passwords do not match.
                  </small>
                )}

              {formData.confirmPassword &&
                formData.password ===
                  formData.confirmPassword && (
                  <small className="success-message">
                    ✓ Passwords match.
                  </small>
                )}

            </div>


            {/* ROLE */}
            <div className="form-group">

              <label htmlFor="role">
                Account Role
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ●
                </span>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Employee">
                    Employee
                  </option>

                  <option value="HR">
                    HR / Admin
                  </option>
                </select>

              </div>

            </div>


            {/* CREATE ACCOUNT BUTTON */}
            <button
              type="submit"
              className="register-button"
            >
              Create Account
              <span>→</span>
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Register;