import express from "express";
const router = express.Router();

// Controllers
import {
  getAllUsers,
  signUp,
  login,
  logout,
  checkAuth,
  createClient,
  checkUserExist,
} from "../controllers/auth.controller.js";

// Middleware
import { verifyToken } from "../middleware/verifyToken.js";

router.get("/getUsers", verifyToken, getAllUsers);
router.post("/signup", signUp);
router.post("/create", createClient);
router.post("/login", login);
router.post("/logout", logout);
router.get("/check", verifyToken, checkAuth);
router.get("/check-user-exist/:userId", checkUserExist);

export default router;
