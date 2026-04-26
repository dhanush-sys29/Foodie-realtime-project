import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { type: String, default: "Main" },
  image: String,
  isVeg: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 20 },
});

export default mongoose.model("MenuItem", menuItemSchema);
