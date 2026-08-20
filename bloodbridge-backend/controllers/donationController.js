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
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your BloodBridge Reward</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- ── Header bar ── -->
        <tr>
          <td style="background:linear-gradient(135deg,#b91c1c 0%,#dc2626 50%,#be123c 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">🩸</div>
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Thank You for Donating!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your generosity saves lives — here's your reward.</p>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px;">

            <!-- Greeting -->
            <p style="margin:0 0 20px;font-size:16px;color:#374151;">Hi <strong style="color:#111827;">${donor.name}</strong>,</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              You donated blood at <strong style="color:#111827;">${bloodBankName}</strong> today.
              Every drop counts — your contribution could save up to <strong style="color:#b91c1c;">3 lives</strong>. 
              As a token of our gratitude, here is your exclusive reward coupon:
            </p>

            <!-- ── Coupon card ── -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:linear-gradient(135deg,#fff1f2 0%,#fef2f2 100%);border:2px dashed #fca5a5;border-radius:14px;padding:28px;text-align:center;">
                  <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;">Your Coupon Code</p>
                  <div style="display:inline-block;background:#b91c1c;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:6px;padding:14px 32px;border-radius:10px;margin:10px 0;font-family:'Courier New',monospace;box-shadow:0 4px 16px rgba(185,28,28,0.35);">
                    ${couponCode}
                  </div>
                  <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Use this code on our partner platforms for exclusive discounts!</p>
                </td>
              </tr>
            </table>

            <!-- Info row -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td width="50%" style="background:#f9fafb;border-radius:10px;padding:16px 20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Donated At</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${bloodBankName}</p>
                </td>
                <td width="8" style="width:8px;"></td>
                <td width="50%" style="background:#f9fafb;border-radius:10px;padding:16px 20px;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Next Eligible Date</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${nextEligible.toDateString()}</p>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 24px;" />

            <!-- Perks note -->
            <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;">
              ❤️ &nbsp;As a token of gratitude, you and your family are eligible for a 
              <strong style="color:#b91c1c;">one-time free medical check-up</strong> through our partner hospitals.
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              Keep donating regularly to unlock more exclusive benefits and help save even more lives!
            </p>

          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="background:#111827;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#f9fafb;font-size:15px;font-weight:700;letter-spacing:-0.3px;">
              🩸 BloodBridge
            </p>
            <p style="margin:0;font-size:12px;color:#6b7280;">
              Connecting donors, hospitals &amp; blood banks in real time.<br/>
              This email was sent because you completed a donation on our platform.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;

      await transporter.sendMail({
        from: `"BloodBridge" <${process.env.EMAIL_USER}>`,
        to: donor.email,
        subject: "🩸 Thank You for Donating Blood — Your BloodBridge Reward Coupon",
        text: `Hi ${donor.name},\n\nThank you for donating blood today at ${bloodBankName}!\n\nYour Coupon Code: ${couponCode}\n\nYou'll be eligible to donate again on ${nextEligible.toDateString()}.\n\n— BloodBridge`,
        html,
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
