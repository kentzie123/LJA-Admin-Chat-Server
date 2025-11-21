import express from 'express';
const router = express.Router();

// Controllers
import { updateUser } from '../controllers/user.controller.js';

// Middleware
import { verifyToken } from '../middleware/verifyToken.js';

router.put('/update-user', verifyToken, updateUser);

export default router;