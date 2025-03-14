import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from  "../models/userModel.js"
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js";

dotenv.config();

const router = express.Router();

// User Registration
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body; 

   console.log("reaching register")
    console.log("req body",req.body)
    const existingUser = await User.findOne({ email });
    console.log("existing user",existingUser)
    if (existingUser) return res.status(400).json({ message: "User already exists" });

   console.log("before hash password")
    const hashedPassword = await bcrypt.hash(password, 10);
console.log("after hash password")
   
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin: isAdmin || false, 
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully!", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

   
    const { password: _, ...userData } = user.toObject();

    res.json({ message: "Login successful", token, user: userData });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all users (Only Admin)
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;
    const userId = req.params.id;

   
    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

   
    if (req.user.userId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (isAdmin !== undefined && req.user.isAdmin) {
      user.isAdmin = isAdmin; 
    }

    await user.save();

  
    const { password: _, ...updatedUser } = user.toObject();

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Delete a User
router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;

   
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router; 
