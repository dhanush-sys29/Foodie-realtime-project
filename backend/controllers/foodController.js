import MenuItem from "../models/MenuItem.js";

export const getFoods = async (req, res) => {
  try {
    const foods = await MenuItem.find({ isAvailable: true }).populate("restaurant", "name email");
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// addFood is deprecated as owners use /api/menu
export const addFood = async (req, res) => {
  res.status(400).json({ message: "Use /api/menu instead" });
};
