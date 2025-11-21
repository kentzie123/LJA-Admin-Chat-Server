import express from "express";
const router = express.Router();

// Controller
import {
  sendMessage,
  getMessages,
  loadMoreMessages,
  clientMessageSender,
} from "../controllers/messages.controller.js";

// Middleware
import { verifyToken } from "../middleware/verifyToken.js";

router.post("/:id", verifyToken, sendMessage);
router.post("/clientSending/:clientId", clientMessageSender);
router.get("/get/:senderId", getMessages);
router.get("/loadMore", verifyToken, loadMoreMessages);

export default router;
