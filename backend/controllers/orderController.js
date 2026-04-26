import mongoose from "mongoose";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import { nanoid } from "nanoid";
import { sendOrderConfirmation, sendStatusUpdate } from "../utils/sendEmail.js";

export const createOrder = async (req, res) => {
  try {
    const trackingId = nanoid(8).toUpperCase();
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const order = await Order.create({
      ...req.body,
      customer: req.user.id,
      user: req.user.id,
      trackingId,
      otp,
      status: "Placed",
      paymentStatus: req.body.paymentVerified ? "Paid" : "Pending",
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('customer user', 'name email');

    // Send confirmation email asynchronously
    const userEmail = populatedOrder.customer?.email || populatedOrder.user?.email;
    const userName = populatedOrder.customer?.name || populatedOrder.user?.name;
    if (userEmail) {
      sendOrderConfirmation({
        to: userEmail,
        name: userName,
        trackingId,
        items: req.body.items,
        total: req.body.total || req.body.totalAmount,
        otp
      }).catch(err => console.error('Failed to send confirmation:', err));
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    let filter = {};
    const role = req.user.role;

    if (role === "customer" || role === "user") {
      filter = { $or: [{ customer: req.user.id }, { user: req.user.id }] };
    } else if (role === "owner") {
      // Find restaurant owned by this user
      const restaurant = await Restaurant.findOne({ owner: req.user.id });
      if (restaurant) filter = { restaurant: restaurant._id };
    } else if (role === "agent") {
      filter = { $or: [
        { status: "Ready" },
        { status: "Placed" },
        { deliveryAgent: req.user.id },
        { agent: req.user.id }
      ]};
    }

    const orders = await Order.find(filter)
      .populate("restaurant", "name image address")
      .populate("customer user", "name email phone")
      .populate("deliveryAgent agent", "name email phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const id = req.params.id;
    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ trackingId: id });
    }

    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.populate("restaurant", "name image address");
    await order.populate("customer user", "name email");
    await order.populate("deliveryAgent agent", "name email phone");

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, agentId } = req.body;
    const id = req.params.id;
    
    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    
    if (!order) {
      order = await Order.findOne({ trackingId: id });
    }

    if (!order) return res.status(404).json({ message: "Order not found" });
    
    await order.populate('customer user', 'name email');
    
    if (status) order.status = status;
    if (agentId) { order.agent = agentId; order.deliveryAgent = agentId; }
    await order.save();

    // Send email update asynchronously
    const userEmail = order.customer?.email || order.user?.email;
    const userName = order.customer?.name || order.user?.name;
    if (status && userEmail) {
      sendStatusUpdate({
        to: userEmail,
        name: userName,
        trackingId: order.trackingId,
        status
      }).catch(err => console.error('Failed to send status update:', err));
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.otp !== req.body.otp) return res.status(400).json({ message: "Invalid OTP" });
    order.status = "Delivered";
    await order.save();
    res.json({ message: "Delivery confirmed!", order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
