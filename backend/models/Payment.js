import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  order:         { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount:        Number,
  currency:      { type: String, default: "INR" },
  status:        { type: String, enum: ["Pending", "Paid", "Failed", "Refunded"], default: "Pending" },
  method:        String,
  createdAt:     { type: Date, default: Date.now },
});

export default mongoose.model("Payment", paymentSchema);
