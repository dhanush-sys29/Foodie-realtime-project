import mongoose from "mongoose"
const connectDb = async () => {
   try {
      await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URL)
      console.log("db connected")
   } catch (error) {
      console.error("db error:", error.message);
   }
}

export default connectDb