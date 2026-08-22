const jwt = require("jsonwebtoken");
const User = require("../records/user");

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "Admin" && req.user.role !== "HR Officer") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};

const verifyEmployee = (req, res, next) => {
  if (req.user.role !== "Employee") {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};

module.exports = {
  authenticate,
  verifyAdmin,
  verifyEmployee,
};
