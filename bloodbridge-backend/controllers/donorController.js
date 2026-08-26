const User = require("../models/User");
const DonorAlert = require("../models/DonorAlert");

// Donor's own profile — used by DonorDashboard to load real data instead of mock
exports.getMyProfile = async (req, res) => {
  try {
    const donor = await User.findByPk(req.user.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });
    res.json(donor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// Donor toggles their own availability
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body; // "available" | "unavailable"
    const donor = await User.findByPk(req.user.id);
    if (!donor) return res.status(404).json({ message: "Donor not found" });

    // Block going "available" early if still inside the post-donation cooldown
    if (status === "available" && donor.nextEligibleDate) {
      const stillCoolingDown = new Date() < new Date(donor.nextEligibleDate);
      if (stillCoolingDown) {
        return res.status(400).json({
          message: `Not eligible until ${new Date(donor.nextEligibleDate).toDateString()}`,
        });
      }
    }
    donor.status = status;
    await donor.save();
    res.json(donor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Fetch active alerts for this donor
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await DonorAlert.findAll({
      where: {
        donorId: req.user.id,
        status: ["pending", "accepted"],
      },
      order: [["updatedAt", "DESC"]],
    });
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch alerts" });
  }
};

// Donor responds to an alert (accept / decline)
exports.respondToAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body; // "accepted" | "declined"
    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({ message: "Invalid response" });
    }

    const alert = await DonorAlert.findOne({
      where: { id, donorId: req.user.id },
    });
    if (!alert) return res.status(404).json({ message: "Alert not found" });

    alert.status = response;
    await alert.save();

    res.json({ message: `Request ${response}`, alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to respond to alert" });
  }
};

