import express from "express";
import { createOrder, getOrders, getOrderById, updateOrderStatus, verifyOTP } from "../controllers/orderController.js";
import { protect, authorize } from "../middlewares/auth.js";

const r = express.Router();

r.post("/",              protect, createOrder);
r.get("/",               protect, getOrders);
r.get("/:id",            protect, getOrderById);
r.put("/:id/status",     protect, updateOrderStatus);
r.post("/:id/verify-otp", protect, verifyOTP);

export default r;
