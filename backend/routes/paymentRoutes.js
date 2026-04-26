import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const r = express.Router();

let razor = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razor = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

r.post("/create", async (req, res) => {
  try {
    if (!razor) {
      // Mock Razorpay Order
      return res.json({ id: "order_mock_" + Date.now(), amount: req.body.amount * 100 });
    }

    const order = await razor.orders.create({
      amount: req.body.amount * 100,
      currency: "INR",
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

r.post("/verify", (req, res) => {
  if (!razor) {
    return res.json({ success: true });
  }

  const body = req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  res.json({ success: expected === req.body.razorpay_signature });
});

export default r;
