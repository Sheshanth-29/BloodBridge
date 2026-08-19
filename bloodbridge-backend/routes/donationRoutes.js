const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getAvailableDonors,
  confirmDonation,
  getMyDonations,
} = require("../controllers/donationController");

router.get("/available-donors", requireAuth, getAvailableDonors);
router.post("/confirm", requireAuth, confirmDonation);
router.get("/mine", requireAuth, getMyDonations);

module.exports = router;
