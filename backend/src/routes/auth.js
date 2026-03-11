const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');

const router = express.Router();

const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Send OTP email via Resend API (HTTP). Use when SMTP is blocked on Render. */
async function sendOtpViaResend(to, otpCode) {
  const apiKey = process.env.RESEND_API_KEY;
  // Resend free tier: use onboarding@resend.dev or your verified domain email
  const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `Productr <${from}>`,
      to: [to],
      subject: 'Your Productr login OTP',
      html: `<p>Your OTP code is</p>
             <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
             <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend API ${res.status}`);
  }
  return true;
}

function createTransporter() {
  const { SMTP_EMAIL, SMTP_PASSWORD } = process.env;

  if (!SMTP_EMAIL || !SMTP_PASSWORD) {
    throw new Error('SMTP_EMAIL or SMTP_PASSWORD is missing in environment');
  }

  // Use port 587 + STARTTLS (often allowed on Render); port 465 can be blocked
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: SMTP_EMAIL,
      pass: SMTP_PASSWORD,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
  });
}

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
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

    if (process.env.RESEND_API_KEY) {
      await sendOtpViaResend(normalizedEmail, otpCode);
    } else {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"Productr OTP" <${process.env.SMTP_EMAIL}>`,
        to: normalizedEmail,
        subject: 'Your Productr login OTP',
        html: `<p>Your OTP code is</p>
               <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
               <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
      });
    }

    return res.json({
      message: 'OTP sent successfully',
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error('Error in /send-otp', err);
    const message =
      process.env.NODE_ENV === 'development'
        ? (err.message || 'Failed to send OTP')
        : 'Failed to send OTP. Check server email config (SMTP or Resend) and logs.';
    return res.status(500).json({ error: message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpEntry = await Otp.findOne({ email: normalizedEmail }).sort({ createdAt: -1 });

    if (!otpEntry) {
      return res.status(400).json({ error: 'OTP not found. Please request a new one.' });
    }

    if (otpEntry.expiresAt < new Date()) {
      await Otp.deleteMany({ email: normalizedEmail });
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (otpEntry.otpCode !== otpCode) {
      return res.status(400).json({ error: 'Invalid OTP code.' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        isVerified: true,
      });
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    await Otp.deleteMany({ email: normalizedEmail });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      secret,
      {
        expiresIn: '7d',
      }
    );

    return res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error('Error in /verify-otp', err);
    return res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;

