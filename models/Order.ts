import mongoose, { Schema, type Document } from "mongoose"

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  quantity: number
  priceAtPurchase: number // Price of the product at the time of purchase
}

export interface IOrder extends Document {
  storeId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // The customer who placed the order
  totalPrice: number
  status: string
  items: IOrderItem[] // Added items array
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema: Schema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: false },
) // Do not create _id for subdocuments

const OrderSchema: Schema = new Schema({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Assuming a User model for customers
  totalPrice: { type: Number, required: true },
  status: { type: String, default: "pending" }, // e.g., 'pending', 'completed', 'cancelled'
  items: [OrderItemSchema], // Array of order items
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)
export default Order
