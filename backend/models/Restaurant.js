import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: String,
  address: { type: String, required: true },
  location: { lat: Number, lng: Number },
  cuisine: [String],
  image: String,
  isOpen: { type: Boolean, default: true },
  hygieneStatus: { type: String, enum: ["Excellent", "Good", "Average", "Poor"], default: "Good" },
  fssaiLicense: String,
  lastInspectionDate: Date,
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Restaurant", restaurantSchema);
