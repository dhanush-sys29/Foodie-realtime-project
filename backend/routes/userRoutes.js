import express from "express";
import {
  register,
  login,
  googleLogin,
  getMe,
  sendOtp
} from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getMe);

export default router;
