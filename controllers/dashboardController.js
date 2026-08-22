const User = require("../records/user");
const Attendance = require("../records/attendance");
const Leave = require("../records/leave");

const getDashboard = async (req, res) => {
  try {
    const employees = await User.find()
      .select("-password")
      .sort({ name: 1 });

    const attendance = await Attendance.find()
      .populate("employee", "employeeId name role department designation")
      .sort({ date: -1 })
      .limit(20);

    const pendingLeaves = await Leave.find({
      status: "Pending",
    })
      .populate("employee", "employeeId name role department designation")
      .sort({ createdAt: -1 });

    const totalEmployees = await User.countDocuments();

    const present = await Attendance.countDocuments({
      status: "Present",
    });

    const pendingLeaveCount = await Leave.countDocuments({
      status: "Pending",
    });

    res.json({
      employees,
      attendance,
      pendingLeaves,

      stats: {
        totalEmployees,
        present,
        pendingLeaves: pendingLeaveCount,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Could not load dashboard",
    });
  }
};

module.exports = { getDashboard };
