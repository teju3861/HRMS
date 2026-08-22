import { useState } from "react";
import Register from "./pages/Register";
import ApplyLeave from "./pages/ApplyLeave";
import Profile from "./pages/Profile";

function App() {
  const [tab, setTab] = useState("leave");

  return (
    <div className="bg-light min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">
            Dayflow HR
          </a>
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm ${
                tab === "leave" ? "btn-light fw-bold" : "btn-outline-light"
              }`}
              onClick={() => setTab("leave")}
            >
              Apply Leave
            </button>
            <button
              className={`btn btn-sm ${
                tab === "profile" ? "btn-light fw-bold" : "btn-outline-light"
              }`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
            <button
              className={`btn btn-sm ${
                tab === "register" ? "btn-light fw-bold" : "btn-outline-light"
              }`}
              onClick={() => setTab("register")}
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      <main className="container py-2">
        {tab === "leave" && <ApplyLeave />}
        {tab === "profile" && <Profile />}
        {tab === "register" && <Register />}
      </main>
    </div>
  );
}

export default App;
