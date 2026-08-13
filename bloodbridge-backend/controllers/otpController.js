const transporter = require("../config/mailer");

// Simple in-memory store for OTPs — fine for a demo project.
// Key: email, Value: { otp, expiresAt }
const otpStore = {};

exports.sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min validity

    await transporter.sendMail({
      from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your BloodBridge verification code",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP. Check your email config." });
  }
};

exports.verifyEmailOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: "No OTP requested for this email" });
  if (Date.now() > record.expiresAt) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired, please request a new one" });
  }
  if (record.otp !== otp) return res.status(400).json({ message: "Incorrect OTP" });

  delete otpStore[email]; // one-time use
  res.json({ message: "Email verified" });
};