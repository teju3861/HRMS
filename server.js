require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authenticationApi = require("./api/authenticationApi");
const dashboardRoutes = require("./routes/dashboardRoutes");
const attendanceApi = require("./api/attendanceApi");

const app = express();

const PORT = process.env.PORT || 5001;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing in .env");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing in .env");
  process.exit(1);
}

app.use(cors());

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "HRMS API is running",
  });
});

app.use("/api/auth", authenticationApi);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/attendance", attendanceApi);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
