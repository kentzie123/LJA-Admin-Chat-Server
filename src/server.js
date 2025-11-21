import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server as SocketIO } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

// Routes
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/messages.route.js";
import userRoutes from "./routes/user.route.js";

const allowedOrigins = [
  "https://chattrixx.netlify.app",
  "http://192.168.1.5:5174",
  "http://localhost:5174",
  "http://localhost:5173",
  "https://ljapower-revised.netlify.app"
];

const app = express();
const server = http.createServer(app);
export const io = new SocketIO(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Test successful!" });
});

const PORT = process.env.PORT || 5000;

export const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  console.log(userSocketMap);

  // io.emit()  is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("call-user", ({ targetId, callerInfo, offer }) => {
    const targetSocketId = userSocketMap[targetId];
    io.to(targetSocketId).emit("incoming-call", {
      fromSocketId: socket.id,
      callerInfo,
      offer,
    });
  });

  socket.on("reject-call", ({ callerUserId }) => {
    const callerSocketId = userSocketMap[callerUserId];
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }
  });

  socket.on("answer-call", ({ fromUserInfo, callerUserId, answer }) => {
    const callerSocketId = userSocketMap[callerUserId];

    if (!callerSocketId) {
      console.log("Caller is no longer connected, can't send answer.");
      return;
    }

    io.to(callerSocketId).emit("call-answered", {
      callerInfo: fromUserInfo,
      answer,
    });
  });

  // Listen for ICE candidates from clients
  socket.on("ice-candidate", ({ targetId, candidate }) => {
    const targetSocketId = userSocketMap[targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ targetId }) => {
    const targetSocketId = userSocketMap[targetId];
    io.to(targetSocketId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
