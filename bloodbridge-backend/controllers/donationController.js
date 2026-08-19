const transporter = require("../config/mailer");
const User = require("../models/User");
const Donation = require("../models/Donation");

const DONATION_COOLDOWN_DAYS = 90; // standard gap between whole blood donations

function generateCouponCode() {
  return "BB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Blood bank searches for donors to confirm — optionally filtered by blood group
exports.getAvailableDonors = async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    const where = { role: "donor", status: "available" };
    if (bloodGroup) where.bloodGroup = bloodGroup;

    const donors = await User.findAll({
      where,
      attributes: ["id", "name", "email", "bloodGroup", "city"],
    });
    res.json(donors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donors" });
  }
};

// The core action: blood bank confirms a real donation happened
exports.confirmDonation = async (req, res) => {
  try {
    const { donorId, units } = req.body;

    const donor = await User.findByPk(donorId);
    if (!donor || donor.role !== "donor") {
      return res.status(404).json({ message: "Donor not found" });
    }

    const bloodBank = await User.findByPk(req.user.id);
    const bloodBankName = bloodBank ? bloodBank.orgName || bloodBank.name : "Blood Bank";

    const today = new Date();
    const nextEligible = new Date(today);
    nextEligible.setDate(nextEligible.getDate() + DONATION_COOLDOWN_DAYS);

    const couponCode = generateCouponCode();

    const donation = await Donation.create({
      donorId: donor.id,
      bloodBankId: req.user.id,
      bloodBankName,
      bloodGroup: donor.bloodGroup,
      units: units || 1,
      donationDate: today,
      couponCode,
    });

    // Update the donor's own record — this is what powers the cooldown/eligibility logic
    donor.lastDonationDate = today;
    donor.nextEligibleDate = nextEligible;
    donor.status = "unavailable";
    await donor.save();

    // Send the reward email — don't fail the whole request if only the email fails
    try {
      await transporter.sendMail({
        from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
        to: donor.email,
        subject: "Thank you for donating — your BloodBridge reward",
        text: `Hi ${donor.name},\n\nThank you for donating blood today at ${bloodBankName}! As a token of appreciation, here's your reward coupon code: ${couponCode}\n\nYou'll be eligible to donate again on ${nextEligible.toDateString()}.\n\n— BloodBridge`,
      });
    } catch (mailErr) {
      console.error("Reward email failed to send:", mailErr.message);
    }

    res.status(201).json({ donation, couponCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to confirm donation" });
  }
};

// Donor's own donation history
exports.getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.findAll({
      where: { donorId: req.user.id },
      order: [["donationDate", "DESC"]],
    });
    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
};
