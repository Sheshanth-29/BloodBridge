const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getMyProfile, updateStatus } = require("../controllers/donorController");

router.get("/me", requireAuth, getMyProfile);
router.patch("/me/status", requireAuth, updateStatus);

module.exports = router;