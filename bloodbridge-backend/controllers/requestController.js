const { sendEmail } = require("../config/mailer");
const User = require("../models/User");
const Request = require("../models/Request");

// ─── Public: fetch a single request by id (used by patient tracking page) ───
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Helper: send status-update email ────────────────────────────────────────
async function sendStatusEmail(toEmail, requesterName, request, status) {
  if (!toEmail) return; // skip if no email on record

  const isApproved = status === "Approved";
  const color = isApproved ? "#27ae60" : "#c0392b";
  const emoji = isApproved ? "✅" : "❌";
  const label = isApproved ? "Approved" : "Declined";

  await sendEmail({
    to: toEmail,
    subject: `BloodBridge — Blood Request ${label}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px;
                  border: 1px solid #e0e0e0; border-radius: 8px; background: #fff;">
        <h2 style="color: #c0392b; margin-bottom: 4px;">BloodBridge &#129656;</h2>
        <p style="color: #333; font-size: 15px;">
          Hi <strong>${requesterName}</strong>,
        </p>
        <p style="color: #555; font-size: 14px;">
          Your blood request has been <strong style="color:${color};">${emoji} ${label}</strong> by the blood bank.
        </p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr style="background:#fafafa;">
            <td style="padding:8px 12px; border:1px solid #eee; color:#888;">Blood Group</td>
            <td style="padding:8px 12px; border:1px solid #eee; font-weight:bold;">${request.bloodGroup}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; border:1px solid #eee; color:#888;">Units Requested</td>
            <td style="padding:8px 12px; border:1px solid #eee;">${request.units}</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:8px 12px; border:1px solid #eee; color:#888;">Status</td>
            <td style="padding:8px 12px; border:1px solid #eee; color:${color}; font-weight:bold;">${label}</td>
          </tr>
        </table>
        ${
          isApproved
            ? `<p style="color:#555; font-size:13px;">
                Please visit the blood bank at your earliest convenience to collect the blood units.
               </p>`
            : `<p style="color:#555; font-size:13px;">
                We're sorry, your request could not be fulfilled at this time.
                Please contact the blood bank for further assistance or submit a new request.
               </p>`
        }
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;" />
        <p style="color:#aaa; font-size:11px;">This is an automated message from BloodBridge. Please do not reply.</p>
      </div>
    `,
    text: `Hi ${requesterName}, your blood request has been ${label}. Blood group: ${request.bloodGroup}, Units: ${request.units}.`,
  });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

exports.createRequest = async (req, res) => {
  try {
    const { bloodGroup, units, name, phone, email, address } = req.body;
    const isHospital = req.user && req.user.role === "hospital";

    // For a hospital request, the requesterName is the hospital's org name.
    // For a patient/individual request (no auth OR non-hospital user), it's
    // the name typed in the form — which is the individual patient's name.
    let requesterName;
    let hospitalName = null;

    if (isHospital) {
      const hospital = await User.findByPk(req.user.id);
      requesterName = hospital ? hospital.orgName || hospital.name : "Hospital";
      hospitalName = requesterName;

      // If the hospital is requesting on behalf of a named patient,
      // capture that patient name separately so the blood bank can see both.
      if (name && name.trim()) {
        requesterName = name.trim();        // show the patient's name on the card
        hospitalName = hospital ? hospital.orgName || hospital.name : "Hospital";
      }
    } else {
      // Direct individual / patient request — use the name from the form
      requesterName = name || "Patient";
    }

    const request = await Request.create({
      requesterType: isHospital ? "hospital" : "patient",
      requesterId: isHospital ? req.user.id : null,
      requesterName,          // individual patient's name (or hospital name if no patient name given)
      hospitalName,           // hospital org name — null for direct patient requests
      contactPhone: phone || null,
      contactEmail: email || null,
      address: address || null,
      bloodGroup,
      units,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create request" });
  }
};


// Blood bank dashboard — view all requests
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};


// Hospital dashboard — view only their own requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: {
        requesterId: req.user.id,
        requesterType: "hospital",
      },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your requests" });
  }
};


// Blood bank approves/declines request — also sends email notification
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Declined", "Pending", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await Request.findByPk(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    await request.save();

    // Send notification email (fire-and-forget — don't block the response)
    if (["Approved", "Declined"].includes(status) && request.contactEmail) {
      sendStatusEmail(
        request.contactEmail,
        request.requesterName || "Requester",
        request,
        status
      ).catch((err) => console.error("Email notification error:", err));
    }

    res.status(200).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update request status" });
  }
};