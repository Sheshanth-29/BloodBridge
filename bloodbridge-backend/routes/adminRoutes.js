const express = require("express");
const router = express.Router();
const { requireAdmin } = require("../middleware/auth");
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getAllRequests,
  getAllDonations,
  getAllStocks,
  createAdmin,
} = require("../controllers/adminController");

// Public admin setup/seeding (or guarded by secret key / existing admin)
router.post("/setup", createAdmin);

// Guarded admin endpoints
router.get("/stats", requireAdmin, getStats);
router.get("/users", requireAdmin, getUsers);
router.patch("/users/:id", requireAdmin, updateUser);
router.delete("/users/:id", requireAdmin, deleteUser);
router.get("/requests", requireAdmin, getAllRequests);
router.get("/donations", requireAdmin, getAllDonations);
router.get("/stocks", requireAdmin, getAllStocks);

module.exports = router;
