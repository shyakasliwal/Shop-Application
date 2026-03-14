const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const Otp = require("../models/Otp");

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;

// 👉 Direct credentials
const SMTP_EMAIL =shy9kasliwal@gmail.com;
const SMTP_PASSWORD =kajjusbqmxtysglq;


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD,
    },
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    family: 4
  });
}

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.deleteMany({ email: normalizedEmail });

    await Otp.create({
      email: normalizedEmail,
      otpCode,
      expiresAt,
    });

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Productr OTP" <${SMTP_EMAIL}>`,
      to: normalizedEmail,
      subject: "Your Login OTP",
      html: `
        <h2>Your OTP Code</h2>
        <p style="font-size:24px;font-weight:bold;letter-spacing:5px">${otpCode}</p>
        <p>This OTP will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
      `,
    });

    res.json({
      message: "OTP sent successfully",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });

  } catch (err) {
    console.error("Error in /send-otp", err);

    res.status(500).json({
      error: "Failed to send OTP"
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpEntry = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!otpEntry) {
      return res.status(400).json({ error: "OTP not found" });
    }

    if (otpEntry.expiresAt < new Date()) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ error: "OTP expired" });
    }

    if (otpEntry.otpCode !== otpCode) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        isVerified: true,
      });
    }

    await Otp.deleteMany({ email: normalizedEmail });

    const token = jwt.sign(
      {
        sub: user._id,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (err) {
    console.error("Error in /verify-otp", err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

module.exports = router;
