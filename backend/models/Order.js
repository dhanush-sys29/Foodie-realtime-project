import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // legacy alias
  restaurant:    { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  agent:         { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // legacy alias
  items: [{
    menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name:      String,
    price:     Number,
    qty:       Number,
    quantity:  Number,
  }],
  totalAmount:   Number,
  total:         Number, // legacy alias
  deliveryAddress: String,
  deliveryLocation: { lat: Number, lng: Number },
  status: {
    type: String,
    enum: ["Placed","Confirmed","Preparing","Ready","Picked Up","Out for Delivery","Awaiting Confirmation","Delivered","Cancelled"],
    default: "Placed",
  },
  paymentId:     String,
  paymentMethod: { type: String, enum: ["Razorpay", "COD"], default: "Razorpay" },
  paymentStatus: { type: String, enum: ["Pending","Paid","Failed"], default: "Pending" },
  qrSealId:      { type: mongoose.Schema.Types.ObjectId, ref: "QRSeal" },
  trackingId:    String,
  estimatedDeliveryTime: Number,
  otp:           String,
  createdAt:     { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
