const express = require("express");

const { getDashboard } = require("../controllers/dashboardController");
const { authenticate } = require("../access/authentication");

const router = express.Router();

router.get("/admin", authenticate, getDashboard);

module.exports = router;
