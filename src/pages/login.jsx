import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Temporary login check for frontend development
    if (email === "employee@dayflow.com" && password === "123456") {
      alert("Login successful!");
    } else {
      setError("Incorrect email or password.");
    }
  }

  return (
    <div className="login-page">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          
          <div className="col-12 col-sm-10 col-md-7 col-lg-5">
            <div className="login-card">

              <div className="text-center mb-4">
                <div className="logo">D</div>

                <h1 className="mt-3">Dayflow</h1>

                <p className="text-muted mb-0">
                  Welcome back! Sign in to your HR workspace.
                </p>
              </div>

              <form onSubmit={handleLogin}>

                <div className="mb-3">
                  <label className="form-label">
                    Work Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <label className="form-label">
                      Password
                    </label>

                    <button
                      type="button"
                      className="forgot-button"
                      onClick={() =>
                        alert("Password reset will be added later.")
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="password-box">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                      type="button"
                      className="show-button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="remember"
                  />

                  <label
                    className="form-check-label"
                    htmlFor="remember"
                  >
                    Remember me
                  </label>
                </div>

                {error && (
                  <div className="alert alert-danger py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn login-button w-100"
                >
                  Sign In
                </button>
              </form>

              <div className="text-center mt-4">
                <span className="text-muted">
                  Don't have an account?
                </span>

                <button
                  className="signup-button"
                  onClick={() =>
                    alert("Registration page will be connected later.")
                  }
                >
                  Create account
                </button>
              </div>

              <div className="security-text text-center mt-4">
                🔒 Your information is securely protected.
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;