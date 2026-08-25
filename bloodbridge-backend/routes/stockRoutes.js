const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getStock, addStock } = require("../controllers/stockController");

// Blood bank views their own stock
router.get("/", requireAuth, getStock);

// Blood bank manually adds stock from the dashboard form
router.post("/add", requireAuth, addStock);

module.exports = router;
