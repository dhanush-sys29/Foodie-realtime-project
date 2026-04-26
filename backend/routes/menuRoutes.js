import express from "express";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// POST /api/menu — add item
router.post("/", protect, authorize("owner"), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user.id });
    if (!restaurant) return res.status(404).json({ message: "Create a restaurant first" });
    const item = await MenuItem.create({ ...req.body, restaurant: restaurant._id });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/menu/:id
router.put("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/menu/:id
router.delete("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/menu/:id/availability
router.put("/:id/availability", protect, authorize("owner"), async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ isAvailable: item.isAvailable });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
