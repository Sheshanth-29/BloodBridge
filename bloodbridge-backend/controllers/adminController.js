const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/User");
const Request = require("../models/Request");
const Donation = require("../models/Donation");
const BloodStock = require("../models/BloodStock");

// ── 1. Global Platform Statistics ──────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      totalDonations,
      allStocks,
      allRequests,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: "donor" } }),
      User.count({ where: { role: "hospital" } }),
      User.count({ where: { role: "bloodbank" } }),
      Donation.count(),
      BloodStock.findAll(),
      Request.findAll({ attributes: ["status", "units"] }),
    ]);

    const totalUnitsInStock = allStocks.reduce((sum, s) => sum + (s.units || 0), 0);

    const requestBreakdown = {
      total: allRequests.length,
      pending: allRequests.filter((r) => r.status === "Pending").length,
      approved: allRequests.filter((r) => r.status === "Approved").length,
      delivered: allRequests.filter((r) => r.status === "Delivered").length,
      declined: allRequests.filter((r) => r.status === "Declined").length,
    };

    res.json({
      totalUsers,
      totalDonors,
      totalHospitals,
      totalBloodBanks,
      totalDonations,
      totalUnitsInStock,
      requests: requestBreakdown,
    });
  } catch (err) {
    console.error("Admin getStats error:", err);
    res.status(500).json({ message: "Failed to fetch administrative statistics" });
  }
};

// ── 2. User Management (Search, Filter, List) ──────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const where = {};

    if (role && ["donor", "hospital", "bloodbank", "admin"].includes(role)) {
      where.role = role;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { phone: { [Op.like]: q } },
        { city: { [Op.like]: q } },
        { orgName: { [Op.like]: q } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "role",
        "bloodGroup",
        "city",
        "status",
        "orgName",
        "address",
        "lastDonationDate",
        "nextEligibleDate",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(users);
  } catch (err) {
    console.error("Admin getUsers error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ── 3. Update User ─────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status, bloodGroup, city, orgName, address } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role && ["donor", "hospital", "bloodbank", "admin"].includes(role)) user.role = role;
    if (status && ["available", "unavailable"].includes(status)) user.status = status;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (city !== undefined) user.city = city;
    if (orgName !== undefined) user.orgName = orgName;
    if (address !== undefined) user.address = address;

    await user.save();

    res.json({ message: "User updated successfully", user });
  } catch (err) {
    console.error("Admin updateUser error:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
};

// ── 4. Delete User ─────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ message: "Administrator cannot delete their own account." });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.json({ message: `User ${user.name} (${user.email}) deleted successfully.` });
  } catch (err) {
    console.error("Admin deleteUser error:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// ── 5. System-wide Requests Monitor ────────────────────────────────────────
exports.getAllRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && ["Pending", "Approved", "Delivered", "Declined"].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { requesterName: { [Op.like]: q } },
        { hospitalName: { [Op.like]: q } },
        { bloodGroup: { [Op.like]: q } },
        { contactEmail: { [Op.like]: q } },
      ];
    }

    const requests = await Request.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    res.json(requests);
  } catch (err) {
    console.error("Admin getAllRequests error:", err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// ── 6. System-wide Donations Ledger ────────────────────────────────────────
exports.getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.findAll({
      order: [["donationDate", "DESC"]],
    });

    // Attach donor names
    const donorIds = donations.map((d) => d.donorId);
    const donors = await User.findAll({
      where: { id: { [Op.in]: donorIds } },
      attributes: ["id", "name", "email", "phone"],
    });

    const donorMap = {};
    donors.forEach((d) => { donorMap[d.id] = d; });

    const enriched = donations.map((d) => ({
      ...d.toJSON(),
      donor: donorMap[d.donorId] || null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Admin getAllDonations error:", err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
};

// ── 7. System-wide Blood Stock Inventory ───────────────────────────────────
exports.getAllStocks = async (req, res) => {
  try {
    const stocks = await BloodStock.findAll({
      order: [["bloodBankId", "ASC"], ["bloodGroup", "ASC"]],
    });

    // Attach blood bank organization names
    const bankIds = [...new Set(stocks.map((s) => s.bloodBankId))];
    const banks = await User.findAll({
      where: { id: { [Op.in]: bankIds } },
      attributes: ["id", "name", "orgName", "city", "phone"],
    });

    const bankMap = {};
    banks.forEach((b) => { bankMap[b.id] = b; });

    const enriched = stocks.map((s) => ({
      ...s.toJSON(),
      bloodBank: bankMap[s.bloodBankId] || { name: `Bank #${s.bloodBankId}` },
    }));

    res.json(enriched);
  } catch (err) {
    console.error("Admin getAllStocks error:", err);
    res.status(500).json({ message: "Failed to fetch stock inventory" });
  }
};

// ── 8. Create Admin User (Seeder / Direct Provisioning) ────────────────────
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      name: name ? name.trim() : "Administrator",
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "0000000000",
      role: "admin",
      status: "available",
    });

    res.status(201).json({
      message: "Admin created successfully",
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    console.error("Admin createAdmin error:", err);
    res.status(500).json({ message: "Failed to create administrator account" });
  }
};
