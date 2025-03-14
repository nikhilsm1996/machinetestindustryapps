import express from "express";
import Order from "../models/orderModel.js";
import { isAuthenticated, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", isAuthenticated, async (req, res) => {
  try {
    const { items, totalPrice } = req.body;

  
    console.log("User data in request:", req.user);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated properly" });
    }

   
    const newOrder = {
      user: req.user._id, 
      items: items,
      totalPrice: totalPrice,
      status: "Pending" 
    };

    console.log("Creating order with data:", newOrder);

  
    const order = new Order(newOrder);
    const savedOrder = await order.save();
    
    console.log("Order saved successfully:", savedOrder._id);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error("Order creation error:", error.message);
    
  
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.get("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email"); // Get user details
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


router.get("/my-orders", isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});


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
    

    console.log("Order user ID (raw):", order.user);
    console.log("Order user ID (string):", order.user ? order.user.toString() : null);
    console.log("Auth user ID (raw):", req.user._id);
    console.log("Auth user ID (string):", req.user._id ? req.user._id.toString() : null);
    
    const orderUserStr = order.user ? order.user.toString() : null;
    const authUserStr = req.user._id ? req.user._id.toString() : null;
    
    console.log("IDs match?", orderUserStr === authUserStr);
    
  
    if (!order.user || 
        (orderUserStr !== authUserStr && 
         orderUserStr !== req.user.id && 
         orderUserStr !== req.user.userId)) {
      console.log("Authorization failed: User IDs don't match");
      return res.status(403).json({ message: "Not authorized to update this order" });
    }
    
    console.log("Authorization passed!");
   
    const { items, totalPrice, status } = req.body;

    if (items && Array.isArray(items) && items.length > 0) order.items = items;
    if (totalPrice) order.totalPrice = totalPrice;

  
    if (status && req.user.isAdmin) order.status = status;

    
    const updatedOrder = await order.save();
    
    console.log("Order successfully updated");
    res.json(updatedOrder);
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});



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
    
   
    if (order.user) {
      
      if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        console.log("Authorization failed: User doesn't own this order and is not admin");
        return res.status(403).json({ message: "Not authorized to delete this order" });
      }
    } else {
      
      if (!req.user.isAdmin) {
        console.log("Authorization failed: Only admins can delete orders without assigned users");
        return res.status(403).json({ message: "Only admins can delete orders without assigned users" });
      }
    }
    
    console.log("Authorization passed!");
    
    
    if (order.status === "Shipped" && !req.user.isAdmin) {
      return res.status(400).json({ 
        message: "Cannot delete an order that has been shipped. Please contact customer support." 
      });
    }
    
    
    await Order.findByIdAndDelete(req.params.id);
    
    console.log("Order successfully deleted");
    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Order delete error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});






export default router;
