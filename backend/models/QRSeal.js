import mongoose from "mongoose";

const qrSealSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  qrCodeData: String,
  payload: {
    restaurantName: String,
    fssaiLicense: String,
    hygieneStatus: String,
    lastInspectionDate: Date,
    orderAuthCode: String,
    generatedAt: Date,
  },
  isActive: { type: Boolean, default: true },
  scanCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("QRSeal", qrSealSchema);
