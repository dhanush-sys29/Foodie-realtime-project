import express from "express";
import crypto from "crypto";
import QRCode from "qrcode";
import QRSeal from "../models/QRSeal.js";
import Restaurant from "../models/Restaurant.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// POST /api/qr/generate/:orderId
router.post("/generate/:orderId", protect, authorize("owner"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const orderAuthCode = crypto.randomBytes(8).toString("hex").toUpperCase();
    const payload = {
      restaurantName: restaurant.name,
      fssaiLicense: restaurant.fssaiLicense || "N/A",
      hygieneStatus: restaurant.hygieneStatus,
      lastInspectionDate: restaurant.lastInspectionDate,
      orderAuthCode,
      generatedAt: new Date(),
    };

    // Deactivate old seals for this restaurant
    await QRSeal.updateMany({ restaurant: restaurant._id }, { isActive: false });

    const seal = await QRSeal.create({
      restaurant: restaurant._id,
      order: req.params.orderId === "restaurant" ? undefined : req.params.orderId,
      payload,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const qrUrl = `${frontendUrl}/qr/verify/${seal._id}`;
    const qrCodeData = await QRCode.toDataURL(qrUrl);

    seal.qrCodeData = qrCodeData;
    await seal.save();

    res.json({ seal, qrCodeData, qrUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/qr/verify/:qrId — public
router.get("/verify/:qrId", async (req, res) => {
  try {
    const seal = await QRSeal.findById(req.params.qrId).populate("restaurant", "name address image");
    if (!seal) return res.status(404).json({ message: "QR Seal not found" });
    seal.scanCount += 1;
    await seal.save();
    res.json(seal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/qr/restaurant/:restaurantId — get active seal
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const seal = await QRSeal.findOne({ restaurant: req.params.restaurantId, isActive: true });
    res.json(seal);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
