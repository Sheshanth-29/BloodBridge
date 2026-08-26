const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getMyProfile,
  updateStatus,
  getAlerts,
  respondToAlert,
} = require("../controllers/donorController");

router.get("/me", requireAuth, getMyProfile);
router.patch("/me/status", requireAuth, updateStatus);
router.get("/alerts", requireAuth, getAlerts);
router.patch("/alerts/:id/respond", requireAuth, respondToAlert);

module.exports = router;