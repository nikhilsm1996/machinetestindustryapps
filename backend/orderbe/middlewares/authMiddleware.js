import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const isAuthenticated = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token is:", decoded); // Debug log
    
    // Ensure the decoded token has a user ID
    if (!decoded._id && !decoded.userId && !decoded.id) {
      console.error("Token does not contain a user ID");
      return res.status(401).json({ message: "Invalid token structure" });
    }
    
    // Normalize the user object structure
    req.user = {
      _id: decoded._id || decoded.userId || decoded.id,
      isAdmin: decoded.isAdmin || false,
      // Add other user properties as needed
    };
    
    console.log("req.user set to:", req.user); // Debug log
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};