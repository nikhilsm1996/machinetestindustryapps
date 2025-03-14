import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User Model
     required:true
    },
    items: [
        {
          name: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
          price: { type: Number, required: true } 
        },
    ],
   
    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
