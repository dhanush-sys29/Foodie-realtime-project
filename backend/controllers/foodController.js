import Food from "../models/Food.js";

export const getFoods = async (req, res) => {
  try {
    const foods = await Food.find().populate("restaurant", "name email");
    res.json(foods);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addFood = async (req, res) => {
  try {
    req.body.restaurant = req.user.id;
    const food = await Food.create(req.body);
    res.status(201).json(food);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
