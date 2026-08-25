require("dotenv").config();

// Sends an email via Brevo's HTTP API (not SMTP) — works on hosts like
// Render that block outbound SMTP ports on free tiers.
async function sendEmail({ to, subject, text, html }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "api-key": process.env.BREVO_API_KEY,
        },
        body: JSON.stringify({
            sender: { name: "BloodBridge", email: process.env.BREVO_SENDER_EMAIL },
            to: [{ email: to }],
            subject,
            textContent: text,
            ...(html ? { htmlContent: html } : {}),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Brevo send failed (${response.status}): ${errorBody}`);
    }

    return response.json();
}

module.exports = { sendEmail };