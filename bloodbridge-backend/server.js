require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const User = require("./models/User");
const Request = require("./models/Request");
const Donation = require("./models/Donation");

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const requestRoutes = require("./routes/requestRoutes");
const donationRoutes = require("./routes/donationRoutes");
const donorRoutes = require("./routes/donorRoutes");

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

const PORT = process.env.PORT || 5000;

sequelize
  .sync()
  .then(() => {
    console.log("✅ Database connected and synced");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    console.error("   Code:", err.original?.code);
    console.error("   Host:", process.env.DB_HOST);
    console.error("   Port:", parseInt(process.env.DB_PORT || process.env.PORT, 10));
    console.error("   User:", process.env.DB_USER);
    console.error("   DB:  ", process.env.DB_NAME);
  });