const nodemailer = require("nodemailer");

// Setup transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your Gmail address
    pass: process.env.EMAIL_PASS  
  }
});

/**
 * This endpoint will be called by the ElevenLabs voice agent webhook
 * and will email booking confirmation + chat details to the admin.
 */
async function bookConsultation(req, res) {
  try {
    // Extract booking details from request body
    const { userName, userEmail, date, time, chatTranscript } = req.body;

    // Format the email body
    const emailBody = `
Booking Confirmation ✅

Client Name: ${userName || "Not provided"}
Client Email: ${userEmail || "Not provided"}
Booking Date: ${date || "Not provided"}
Booking Time: ${time || "Not provided"}

--- Chat Transcript ---
${chatTranscript || "No transcript provided"}
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "pawanxandromeda@gmail.com",
      subject: `Booking Confirmed - ${userName || "Client"}`,
      text: emailBody
    });

    return res.json({
      success: true,
      message: "Booking confirmed. Email sent with chat details."
    });

  } catch (err) {
    console.error("Error sending booking email:", err);
    return res.status(500).json({ success: false, error: "Failed to send booking email" });
  }
}

module.exports = { bookConsultation };
