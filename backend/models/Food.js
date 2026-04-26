import mongoose from "mongoose";

export default mongoose.model(
  "Food",
  new mongoose.Schema({
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    price: Number,
    image: String,
  })
);
