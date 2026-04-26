import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";


connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// ── Socket.IO ──
io.on("connection", (socket) => {
  socket.on("joinOrderTracking", ({ trackingId }) => socket.join(trackingId));
  socket.on("customer:join",    ({ orderId })    => socket.join(`order_${orderId}`));
  socket.on("restaurant:join",  ({ restaurantId }) => socket.join(`restaurant_${restaurantId}`));

  socket.on("agentLocationUpdate", (data) => {
    io.to(data.trackingId).emit("locationUpdate", { lat: data.lat, lng: data.lng });
  });
  socket.on("agent:location-update", ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit("delivery:location", { lat, lng });
  });

  socket.on("stopTracking", ({ trackingId }) => {
    io.to(trackingId).emit("deliveryCompleted");
    socket.leave(trackingId);
  });

  socket.on("order:status-update", ({ orderId, status, restaurantId }) => {
    io.to(`order_${orderId}`).emit("order:status-update", { orderId, status });
    if (restaurantId) io.to(`restaurant_${restaurantId}`).emit("order:new", { orderId });
    // Notify all agents if order is ready/placed
    if (["Placed", "Confirmed", "Ready"].includes(status)) {
      io.emit("order:available", { orderId, status });
    }
  });
});

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// ── Routes ──
app.use("/api/users",       userRoutes);
app.use("/api/foods",       foodRoutes);
app.use("/api/orders",      orderRoutes);
app.use("/api/payment",     paymentRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menu",        menuRoutes);
app.use("/api/qr",          qrRoutes);
app.use("/api/reviews",     reviewRoutes);
app.use("/api/delivery",    deliveryRoutes);

app.get("/", (_, res) => res.json({ status: "FOODIE API running 🍕" }));

server.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Server running on port", process.env.PORT || 5000)
);
