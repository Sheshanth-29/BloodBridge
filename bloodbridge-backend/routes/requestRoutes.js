const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  updateRequestStatus,
} = require("../controllers/requestController");

// Anyone can create a request — hospital (logged in) or patient (anonymous)
router.post("/", optionalAuth, createRequest);

// Blood bank dashboard — view all requests
router.get("/", requireAuth, getAllRequests);

// Hospital dashboard — view only their own requests
router.get("/mine", requireAuth, getMyRequests);

// Blood bank approves/declines
router.patch("/:id", requireAuth, updateRequestStatus);

module.exports = router;