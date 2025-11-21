import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
  const token = jwt.sign({ user }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("chat_token", token, {
    httpOnly: true,
    secure: true, // true if using HTTPS
    sameSite: "None", // "None" if not same host change to "lax" for development
  });
  
  return token;
};
