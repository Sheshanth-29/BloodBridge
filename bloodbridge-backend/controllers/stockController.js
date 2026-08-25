const BloodStock = require("../models/BloodStock");
const { requireAuth } = require("../middleware/auth");

const ALL_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// GET /api/stock — returns full stock for the logged-in blood bank.
// If a blood group has no row yet, it is returned with units: 0.
exports.getStock = async (req, res) => {
  try {
    const rows = await BloodStock.findAll({
      where: { bloodBankId: req.user.id },
    });

    // Build a complete list for all 8 groups so the UI always shows all tiles
    const map = {};
    rows.forEach((r) => { map[r.bloodGroup] = r; });

    const stock = ALL_GROUPS.map((bg, i) => ({
      id: i + 1,
      bloodGroup: bg,
      units: map[bg] ? map[bg].units : 0,
      expiryDate: map[bg] ? map[bg].expiryDate : null,
    }));

    res.json(stock);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stock" });
  }
};

// POST /api/stock/add — manually add units (from the dashboard form)
exports.addStock = async (req, res) => {
  try {
    const { bloodGroup, units, expiryDate } = req.body;
    if (!bloodGroup || !units) {
      return res.status(400).json({ message: "bloodGroup and units are required" });
    }

    const [row] = await BloodStock.findOrCreate({
      where: { bloodBankId: req.user.id, bloodGroup },
      defaults: { units: 0, expiryDate: null },
    });

    row.units += parseInt(units, 10);
    if (expiryDate) row.expiryDate = expiryDate;
    await row.save();

    res.json({ bloodGroup: row.bloodGroup, units: row.units, expiryDate: row.expiryDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update stock" });
  }
};
