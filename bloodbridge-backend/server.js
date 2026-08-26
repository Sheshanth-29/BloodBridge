require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const User = require("./models/User");
const Request = require("./models/Request");
const Donation = require("./models/Donation");
const BloodStock = require("./models/BloodStock");
const DonorAlert = require("./models/DonorAlert");

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const requestRoutes = require("./routes/requestRoutes");
const donationRoutes = require("./routes/donationRoutes");
const donorRoutes = require("./routes/donorRoutes");
const stockRoutes = require("./routes/stockRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "BloodBridge backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/stock", stockRoutes);

const PORT = process.env.PORT || 5000;

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Database connected and synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });