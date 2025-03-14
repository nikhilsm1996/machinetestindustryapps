import express from "express";
import Order from "../models/orderModel.js";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private (Only authenticated users)
 */
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { items, totalPrice } = req.body;

    // Debug what's in req.user
    console.log("User data in request:", req.user);

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated properly" });
    }

    // Create new order
    const newOrder = {
      user: req.user._id, // This should be the MongoDB ObjectId
      items: items,
      totalPrice: totalPrice,
      status: "Pending" // Match the case in your schema enum
    };

    console.log("Creating order with data:", newOrder);

    // Create and save the order
    const order = new Order(newOrder);
    const savedOrder = await order.save();
    
    console.log("Order saved successfully:", savedOrder._id);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation error:", error.message);
    
    // Check if it's a validation error
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



/**
 * @route   GET /api/orders
 * @desc    Get all orders (Admin only)
 * @access  Private (Admin)
 */
router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email"); // Get user details
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get logged-in user's orders
 * @access  Private (User)
 */
router.get("/my-orders", isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

/**
 * @route   GET /api/orders/:id
 * @desc    Get a single order (Admin or owner only)
 * @access  Private
 */
// router.get("/:id", isAuthenticated, async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id).populate("user", "name email");
//     console.log("order",order)

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Only allow the owner or admin to access the order
//     if (order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
//       return res.status(403).json({ message: "Not authorized" });
//     }

//     res.json(order);
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error });
//   }
// });

/**
 * @route   PUT /api/orders/:id
 * @desc    Update an order (Admin or owner only)
 * @access  Private
 */
router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    console.log("Order update attempt for ID:", req.params.id);
    console.log("Authenticated user:", req.user);

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      console.log("Order not found with ID:", req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log("Order found:", {
      id: order._id,
      userId: order.user,
      items: order.items.length,
      status: order.status
    });
    
    // More detailed comparison logging
    console.log("Order user ID (raw):", order.user);
    console.log("Order user ID (string):", order.user ? order.user.toString() : null);
    console.log("Auth user ID (raw):", req.user._id);
    console.log("Auth user ID (string):", req.user._id ? req.user._id.toString() : null);
    
    const orderUserStr = order.user ? order.user.toString() : null;
    const authUserStr = req.user._id ? req.user._id.toString() : null;
    
    console.log("IDs match?", orderUserStr === authUserStr);
    
    // Try more flexible comparison
    if (!order.user || 
        (orderUserStr !== authUserStr && 
         orderUserStr !== req.user.id && 
         orderUserStr !== req.user.userId)) {
      console.log("Authorization failed: User IDs don't match");
      return res.status(403).json({ message: "Not authorized to update this order" });
    }
    
    console.log("Authorization passed!");
    
    // Rest of your code for updating the order...
    const { items, totalPrice, status } = req.body;

    // Update fields if provided
    if (items && Array.isArray(items) && items.length > 0) order.items = items;
    if (totalPrice) order.totalPrice = totalPrice;

    // Allow status update only for admins
    if (status && req.user.isAdmin) order.status = status;

    // Save the updated order
    const updatedOrder = await order.save();
    
    console.log("Order successfully updated");
    res.json(updatedOrder);
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});





/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete an order (Admin or owner only)
 * @access  Private
 */


router.delete("/:id", isAuthenticated, async (req, res) => {
  try {
    console.log("Order delete attempt for ID:", req.params.id);
    console.log("Authenticated user:", req.user);

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      console.log("Order not found with ID:", req.params.id);
      return res.status(404).json({ message: "Order not found" });
    }
    
    console.log("Order found:", {
      id: order._id,
      userId: order.user,
      status: order.status
    });
    
    // Check authorization: user owns the order OR is an admin
    if (order.user) {
      // If order has an assigned user, must be same as authenticated user or admin
      if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        console.log("Authorization failed: User doesn't own this order and is not admin");
        return res.status(403).json({ message: "Not authorized to delete this order" });
      }
    } else {
      // For orders without users, only admins can delete
      if (!req.user.isAdmin) {
        console.log("Authorization failed: Only admins can delete orders without assigned users");
        return res.status(403).json({ message: "Only admins can delete orders without assigned users" });
      }
    }
    
    console.log("Authorization passed!");
    
    // Add business logic if needed
    // For example, maybe don't allow deletion of shipped orders
    if (order.status === "Shipped" && !req.user.isAdmin) {
      return res.status(400).json({ 
        message: "Cannot delete an order that has been shipped. Please contact customer support." 
      });
    }
    
    // Perform the deletion
    await Order.findByIdAndDelete(req.params.id);
    
    console.log("Order successfully deleted");
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});






export default router;
