const express = require("express");

const { register, login, me } = require("../actions/authenticationActions");
const { authenticate } = require("../access/authentication");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;
