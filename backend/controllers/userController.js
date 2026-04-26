import jwt from "jsonwebtoken";
import User from "../models/User.js";
import OTP from "../models/OTP.js";
import { OAuth2Client } from "google-auth-library";
import { sendOtpEmail } from "../utils/sendEmail.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const token = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email is already registered" });

    // Generate 6 digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    await OTP.create({ email, otp: generatedOtp });

    // Send Email
    const result = await sendOtpEmail(
      email,
      "Your FOODIE Verification Code",
      `Welcome to FOODIE! Your verification code is: <strong style="font-size:24px;letter-spacing:4px;color:#FF6B35">${generatedOtp}</strong>. This code expires in 5 minutes.`
    );

    if (!result.success) {
      return res.status(500).json({ message: "Failed to send email verification" });
    }

    res.json({ message: "OTP sent successfully. Please check your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role, otp } = req.body;
    
    if (!otp) return res.status(400).json({ message: "OTP is required for registration" });

    // Verify OTP
    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) return res.status(400).json({ message: "OTP expired or invalid" });
    if (otpRecord.otp !== otp) return res.status(400).json({ message: "Incorrect OTP" });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = await User.create({ name, email, password, role: role || "user" });

    // Clean up OTP
    await OTP.deleteMany({ email });

    res.json({ token: token(user._id, user.role), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid email or password for this role" });

    res.json({ token: token(user._id, user.role), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: req.body.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const data = ticket.getPayload();
    const { role } = req.body;

    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = await User.create({
        name: data.name,
        email: data.email,
        role: role || "user",
      });
    } else if (role && user.role !== role && user.role !== 'admin') {
      return res.status(401).json({ message: `Account exists with role ${user.role}` });
    }

    res.json({ token: token(user._id, user.role), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
