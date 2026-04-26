import express from "express";
import Review from "../models/Review.js";
import Restaurant from "../models/Restaurant.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

// POST /api/reviews
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const { restaurantId, orderId, rating, comment } = req.body;
    const review = await Review.create({
      customer: req.user.id,
      restaurant: restaurantId,
      order: orderId,
      rating,
      comment,
    });

    // Update restaurant average rating
    const all = await Review.find({ restaurant: restaurantId });
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await Restaurant.findByIdAndUpdate(restaurantId, { rating: avg.toFixed(1), totalReviews: all.length });

    res.status(201).json(review);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/reviews/restaurant/:id
router.get("/restaurant/:id", async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.id })
      .populate("customer", "name profileImage")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
