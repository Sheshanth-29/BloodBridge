const { sendEmail } = require("../config/mailer");
const { Op } = require("sequelize");
const User = require("../models/User");
const Donation = require("../models/Donation");
const BloodStock = require("../models/BloodStock");
const DonorAlert = require("../models/DonorAlert");

const DONATION_COOLDOWN_DAYS = 90; // standard gap between whole blood donations

function generateCouponCode() {
  return "BB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Blood bank searches for donors — includes their current notification/alert status
exports.getAvailableDonors = async (req, res) => {
  try {
    const { bloodGroup } = req.query;
    const where = { role: "donor", status: "available" };
    if (bloodGroup) where.bloodGroup = bloodGroup;

    const donors = await User.findAll({
      where,
      attributes: ["id", "name", "email", "bloodGroup", "city"],
    });

    // Find any alerts sent by this blood bank to these donors
    const donorIds = donors.map((d) => d.id);
    const alerts = await DonorAlert.findAll({
      where: {
        bloodBankId: req.user.id,
        donorId: { [Op.in]: donorIds },
      },
    });

    const alertMap = {};
    alerts.forEach((a) => {
      // Pick the most recent alert for each donor
      if (!alertMap[a.donorId] || new Date(a.updatedAt) > new Date(alertMap[a.donorId].updatedAt)) {
        alertMap[a.donorId] = a;
      }
    });

    const donorsWithAlerts = donors.map((d) => {
      const alert = alertMap[d.id];
      return {
        id: d.id,
        name: d.name,
        email: d.email,
        bloodGroup: d.bloodGroup,
        city: d.city,
        alertStatus: alert ? alert.status : null,
        alertId: alert ? alert.id : null,
      };
    });

    res.json(donorsWithAlerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donors" });
  }
};

// Blood bank notifies a donor that their blood is urgently needed
exports.notifyDonor = async (req, res) => {
  try {
    const { donorId, message } = req.body;
    const donor = await User.findByPk(donorId);
    if (!donor || donor.role !== "donor") {
      return res.status(404).json({ message: "Donor not found" });
    }

    const bloodBank = await User.findByPk(req.user.id);
    const bloodBankName = bloodBank ? bloodBank.orgName || bloodBank.name : "Blood Bank";

    let alert = await DonorAlert.findOne({
      where: { donorId: donor.id, bloodBankId: req.user.id },
    });

    if (alert) {
      alert.status = "pending";
      alert.bloodBankName = bloodBankName;
      alert.bloodGroup = donor.bloodGroup;
      alert.message = message || `Urgent: ${bloodBankName} needs ${donor.bloodGroup} blood right now!`;
      await alert.save();
    } else {
      alert = await DonorAlert.create({
        donorId: donor.id,
        bloodBankId: req.user.id,
        bloodBankName,
        bloodGroup: donor.bloodGroup,
        message: message || `Urgent: ${bloodBankName} needs ${donor.bloodGroup} blood right now!`,
        status: "pending",
      });
    }

    res.json({ message: "Donor notified successfully", alert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to notify donor" });
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

    // Mark any active DonorAlert as completed
    await DonorAlert.update(
      { status: "completed" },
      { where: { donorId: donor.id, bloodBankId: req.user.id } }
    );

    // ── Auto-update blood bank stock with 1-month expiry date ────────────────
    const bloodExpiry = new Date(today);
    bloodExpiry.setMonth(bloodExpiry.getMonth() + 1);
    const expiryDateStr = bloodExpiry.toISOString().split("T")[0];

    const [stockRow] = await BloodStock.findOrCreate({
      where: { bloodBankId: req.user.id, bloodGroup: donor.bloodGroup },
      defaults: { units: 0, expiryDate: expiryDateStr },
    });
    stockRow.units += (units || 1);
    stockRow.expiryDate = expiryDateStr;
    await stockRow.save();

    // Send the reward email — don't fail the whole request if only the email fails
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your BloodBridge Reward</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">

        <!-- ── RED HEADER ── -->
        <tr>
          <td style="background:linear-gradient(160deg,#b91c1c 0%,#dc2626 55%,#be123c 100%);padding:44px 40px 36px;text-align:center;">

            <!-- Blood-drop SVG icon in a frosted circle -->
            <div style="display:inline-block;background:rgba(255,255,255,0.18);border-radius:50%;width:72px;height:72px;margin-bottom:18px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72">
                <path d="M36 14 C36 14 20 32 20 44 C20 53.4 27.2 61 36 61 C44.8 61 52 53.4 52 44 C52 32 36 14 36 14 Z" fill="rgba(255,255,255,0.90)"/>
              </svg>
            </div>

            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;">Thank You for Donating!</h1>
            <p style="margin:10px 0 0;color:rgba(255,255,255,0.82);font-size:14px;">Your generosity saves lives &#8212; here&apos;s your reward.</p>
          </td>
        </tr>

        <!-- ── WHITE BODY ── -->
        <tr>
          <td style="background:#ffffff;padding:36px 40px 32px;">

            <p style="margin:0 0 18px;font-size:16px;color:#374151;">Hi <strong style="color:#111827;">${donor.name}</strong>,</p>

            <p style="margin:0 0 30px;font-size:15px;color:#6b7280;line-height:1.7;">
              You donated blood at <strong style="color:#111827;">${bloodBankName}</strong> today.
              Every drop counts &#8212; your contribution could save up to <strong style="color:#b91c1c;">3 lives</strong>.
              As a token of our gratitude, here is your exclusive reward coupon:
            </p>

            <!-- ── COUPON CARD ── -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:30px;">
              <tr>
                <td style="background:linear-gradient(135deg,#fff1f2 0%,#fef2f2 100%);border:2px dashed #fca5a5;border-radius:16px;padding:30px 24px;text-align:center;">
                  <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#9ca3af;">Your Coupon Code</p>
                  <div style="display:inline-block;background:#9b1c1c;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:5px;padding:14px 36px;border-radius:12px;margin:4px 0 14px;font-family:'Courier New',Courier,monospace;">
                    ${couponCode}
                  </div>
                  <p style="margin:0;font-size:12px;color:#9ca3af;">Use this code on our partner platforms for exclusive discounts!</p>
                </td>
              </tr>
            </table>

            <!-- ── INFO TILES ── -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f9fafb;border-radius:12px;padding:16px 20px;vertical-align:top;width:50%;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Donated At</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${bloodBankName}</p>
                </td>
                <td style="width:10px;"></td>
                <td style="background:#f9fafb;border-radius:12px;padding:16px 20px;vertical-align:top;width:50%;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;">Next Eligible Date</p>
                  <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${nextEligible.toDateString()}</p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 22px;" />

            <p style="margin:0 0 6px;font-size:14px;color:#374151;line-height:1.6;">
              &#10084;&#65039;&nbsp; As a token of gratitude, you and your family are eligible for a
              <strong style="color:#b91c1c;">one-time free medical check-up</strong> through our partner hospitals.
            </p>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
              Keep donating regularly to unlock more exclusive benefits and help save even more lives!
            </p>

          </td>
        </tr>

        <!-- ── FOOTER ── -->
        <tr>
          <td style="background:#111827;padding:24px 40px;text-align:center;border-radius:0 0 20px 20px;">
            <p style="margin:0 0 6px;color:#f9fafb;font-size:15px;font-weight:700;letter-spacing:-0.3px;">&#129656; BloodBridge</p>
            <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
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

      await sendEmail({
        to: donor.email,
        subject: "Thank You for Donating! — Your BloodBridge Reward Coupon",
        text: `Hi ${donor.name},\n\nThank you for donating blood today at ${bloodBankName}! Your contribution could save up to 3 lives.\n\nYour Reward Coupon Code: ${couponCode}\n\nYou'll be eligible to donate again on ${nextEligible.toDateString()}.\n\n— BloodBridge`,
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
