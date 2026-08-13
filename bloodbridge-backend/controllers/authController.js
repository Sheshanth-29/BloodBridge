const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Shape the user object sent back to the frontend — never send the password back
const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  bloodGroup: user.bloodGroup,
  city: user.city,
  status: user.status,
  orgName: user.orgName,
});

exports.signup = async (req, res) => {
  try {
    const { name, email, password, phone, role, bloodGroup, city, orgName, address } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      bloodGroup: role === "donor" ? bloodGroup : null,
      city: role === "donor" ? city : null,
      orgName: role === "hospital" || role === "bloodbank" ? orgName : null,
      address: role === "hospital" || role === "bloodbank" ? address : null,
    });

    const token = generateToken(user);
    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed. Please try again." });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.json({ user: formatUser(user), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
};