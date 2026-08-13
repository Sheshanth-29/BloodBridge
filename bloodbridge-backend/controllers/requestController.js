const Request = require("../models/Request");
const User = require("../models/User");

// Creates a request — works for both a logged-in hospital AND an anonymous patient
exports.createRequest = async (req, res) => {
  try {
    const { bloodGroup, units, name, phone, email } = req.body;
    const isHospital = req.user && req.user.role === "hospital";

    let requesterName = name;
    if (isHospital) {
      const hospital = await User.findByPk(req.user.id);
      requesterName = hospital ? hospital.orgName || hospital.name : "Hospital";
    }

    const request = await Request.create({
      requesterType: isHospital ? "hospital" : "patient",
      requesterId: isHospital ? req.user.id : null,
      requesterName,
      contactPhone: phone || null,
      contactEmail: email || null,
      bloodGroup,
      units,
    });

    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create request" });
  }
};

// Blood bank view — sees every request, newest first
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({ order: [["createdAt", "DESC"]] });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// Hospital view — only their own requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Request.findAll({
      where: { requesterId: req.user.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your requests" });
  }
};

// Blood bank approves or declines a request
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // "Approved" or "Declined"
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = status;
    if (status === "Approved") {
      request.dispatchedAt = new Date(); // marks the start of the mock 20-min delivery window
    }
    await request.save();

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update request" });
  }
};