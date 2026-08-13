require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/db");
const User = require("./models/User");
const Request = require("./models/Request");

const authRoutes = require("./routes/authRoutes");
const otpRoutes = require("./routes/otpRoutes");
const requestRoutes = require("./routes/requestRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "BloodBridge backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/requests", requestRoutes);

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
  });