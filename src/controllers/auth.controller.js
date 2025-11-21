// Utils
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateToken.js";

// Response handler
import { success, error } from "../utils/responseHandlers.js";

// Socket
import { io } from "../server.js";

// Services
import {
  getUsers,
  addUser,
  getUserByEmail,
  getUserById,
} from "../services/user.service.js";

// Fetch All Users Controller
export const getAllUsers = async (req, res) => {
  const user = req.user;

  const { data, error: err } = await getUsers(user.id);

  if (err || !data) {
    return error(res, err?.message || "Something went wrong");
  }

  return success(res, data);
};

// Register new users
export const signUp = async (req, res) => {
  let { email, fullname, password } = req.body;

  if (!email || !fullname || !password) {
    return error(res, "Missing required fields.", 400);
  }

  if (password.length < 6) {
    return error(res, "Password must be at least 6 characters.", 400);
  }

  // const salt = await bcrypt.genSalt(10);
  // password = await bcrypt.hash(password, salt);

  const { data, error: err } = await addUser([{ email, fullname, password }]);

  if (err || data.length === 0) {
    return error(res, err.message);
  }

  const userInfo = data[0];
  generateToken(
    {
      id: userInfo.id,
      fullname: userInfo.fullname,
      email: userInfo.email,
      profile_pic: userInfo.profile_pic,
    },
    res
  );
  return success(
    res,
    {
      id: userInfo.id,
      fullname: userInfo.fullname,
      email: userInfo.email,
      profile_pic: userInfo.profile_pic,
    },
    201
  );
};

export const createClient = async (req, res) => {
  let { clientId } = req.body;

  console.log(`Creating client: ${clientId}`);

  if (!clientId) {
    return error(res, "Missing id.", 400);
  }

  const { data, error: err } = await addUser([
    { id: clientId, fullname: clientId },
  ]);

  if (err || data.length === 0) {
    return error(res, err.message);
  }

  const CHAT_ADMIN_ID = process.env.CHAT_ADMIN_ID;

  io.to(userSocketMap[CHAT_ADMIN_ID]).emit("new_user", data[0]);
  return success(res, "Create client account successfully!", 201);
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, "Missing required fields.", 400);
  }

  const { data, error: err } = await getUserByEmail(email);

  if (err || data.length === 0) {
    return error(res, "Invalid credentials", 400);
  }

  const userInfo = data[0];
  const isPasswordCorrect = password === userInfo.password;

  if (!isPasswordCorrect) {
    return error(res, "Invalid credentials", 400);
  }

  generateToken(
    {
      id: userInfo.id,
      fullname: userInfo.fullname,
      email: userInfo.email,
      profile_pic: userInfo.profile_pic,
    },
    res
  );

  return success(res, {
    id: userInfo.id,
    fullname: userInfo.fullname,
    email: userInfo.email,
    profile_pic: userInfo.profile_pic,
  });
};

// Logout user
export const logout = (req, res) => {
  try {
    res.clearCookie("chat_token", {
      httpOnly: true,
      secure: true, // true if using HTTPS
      sameSite: "None", // "None" if not same host change to "lax" for development
    });
    return success(res, "Logged out successfully");
  } catch (err) {
    return error(res, "Something went wrong", 500);
  }
};

export const checkAuth = async (req, res) => {
  const userInfo = req.user;

  if (!userInfo) return error(res, "Unauthorized", 401);

  const { data, error: err } = await getUserById(userInfo.id);

  if (err || data.length === 0) {
    return error(res, "No user found!", 404);
  }
  return success(res, data);
};

export const checkUserExist = async (req, res) => {
  const { userId } = req.params;

  const { data, error: err } = await getUserById(userId);

  return success(res, data);
};
