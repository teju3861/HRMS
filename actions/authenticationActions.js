const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../records/user");

const sanitizeUser = (user) => {
  return {
    _id: user._id,
    employeeId: user.employeeId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    department: user.department,
    designation: user.designation,
    joiningDate: user.joiningDate,
    profilePicture: user.profilePicture,
    status: user.status,
  };
};

const createToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

const register = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, role } = req.body;

    if (!employeeId || !name || !email || !password || !role) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (!["Admin", "HR Officer", "Employee"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (req.user && req.user.role === "HR Officer" && role !== "Employee") {
      return res.status(403).json({
        message: "HR Officers can only create Employee accounts",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      employeeId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      user: sanitizeUser(user),
      token: createToken(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      user: sanitizeUser(user),
      token: createToken(user),
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
  });
};

const updateProfile = async (req, res, next) => {
  try {
    const { phone, address, name } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (name !== undefined) user.name = name;

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    let admin = await User.findOne({ email: "admin@dayflow.com" });
    if (!admin) {
      admin = await User.create({
        employeeId: "ADM001",
        name: "Manager",
        email: "admin@dayflow.com",
        password: hashedPassword,
        role: "Admin",
        department: "Executive Management",
        designation: "HR Manager",
        phone: "+1 (555) 019-2834",
        address: "Dayflow HQ, 100 Innovation Way, Enterprise City",
      });
      console.log("Default Manager created: admin@dayflow.com / admin123");
    } else {
      admin.name = "Manager";
      admin.password = hashedPassword;
      admin.role = "Admin";
      await admin.save();
      console.log("Default Manager password reset to admin123");
    }

    // Rename any System Manager or Admin User in DB to Manager
    await User.updateMany(
      { name: /system manager|admin user/i },
      { name: "Manager" }
    );
  } catch (err) {
    console.error("Error seeding default admin:", err.message);
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  seedAdmin,
};
