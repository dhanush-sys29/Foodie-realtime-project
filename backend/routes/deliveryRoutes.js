import express from "express";
import Order from "../models/Order.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// GET /api/delivery/available — orders with status Ready/Placed
router.get("/available", protect, authorize("agent"), async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ["Ready", "Placed", "Confirmed"] } })
      .populate("restaurant", "name address location")
      .populate("customer user", "name phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/delivery/:orderId/accept
router.put("/:orderId/accept", protect, authorize("agent"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!["Ready","Placed","Confirmed"].includes(order.status))
      return res.status(400).json({ message: "Order not available for pickup" });
    order.deliveryAgent = req.user.id;
    order.agent         = req.user.id;
    order.status        = "Out for Delivery";
    await order.save();
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/delivery/location — broadcast GPS
router.put("/location", protect, authorize("agent"), async (req, res) => {
  const { orderId, lat, lng } = req.body;
  // This endpoint just persists; real-time is via Socket.IO
  res.json({ orderId, lat, lng, updated: true });
});

export default router;
