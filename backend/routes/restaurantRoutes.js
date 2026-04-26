import express from "express";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// GET /api/restaurants — public list
router.get("/", async (req, res) => {
  try {
    const { cuisine, search } = req.query;
    let query = {};
    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { cuisine: { $in: [new RegExp(search, "i")] } },
    ];
    const restaurants = await Restaurant.find(query).populate("owner", "name email");
    res.json(restaurants);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurants/:id
router.get("/:id", async (req, res) => {
  try {
    const r = await Restaurant.findById(req.params.id).populate("owner", "name email");
    if (!r) return res.status(404).json({ message: "Not found" });
    res.json(r);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurants/:id/menu
router.get("/:id/menu", async (req, res) => {
  try {
    const items = await MenuItem.find({ restaurant: req.params.id, isAvailable: true });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/restaurants — owner only
router.post("/", protect, authorize("owner"), async (req, res) => {
  try {
    const exists = await Restaurant.findOne({ owner: req.user.id });
    if (exists) return res.status(400).json({ message: "You already have a restaurant" });
    const restaurant = await Restaurant.create({ ...req.body, owner: req.user.id });
    res.status(201).json(restaurant);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurants/:id
router.put("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    const r = await Restaurant.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body, { new: true }
    );
    if (!r) return res.status(404).json({ message: "Not found or unauthorized" });
    res.json(r);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/restaurants/:id/toggle — open/close
router.put("/:id/toggle", protect, authorize("owner"), async (req, res) => {
  try {
    const r = await Restaurant.findOne({ _id: req.params.id, owner: req.user.id });
    if (!r) return res.status(404).json({ message: "Not found" });
    r.isOpen = !r.isOpen;
    await r.save();
    res.json({ isOpen: r.isOpen });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/restaurants/my/profile — owner gets their own
router.get("/my/profile", protect, authorize("owner"), async (req, res) => {
  try {
    const r = await Restaurant.findOne({ owner: req.user.id });
    res.json(r);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
