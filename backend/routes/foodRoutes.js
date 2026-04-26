import express from "express";
import { getFoods, addFood } from "../controllers/foodController.js";
import { protect, authorize } from "../middlewares/auth.js";

const router = express.Router();

router.route("/")
  .get(getFoods)
  .post(protect, authorize("owner"), addFood);

export default router;
