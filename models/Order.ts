import mongoose, { Schema, Document, Model } from "mongoose"

// Define an interface for each item in the order
interface IOrderItem {
  productName: string
  productId: mongoose.Types.ObjectId // reference to Product
  quantity: number
  priceAtPurchase: number
}

// Define the full order interface
export interface IOrder extends Document {
  storeId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  totalPrice: number
  status: string
  items: IOrderItem[]
  paymentMethod?: string
  receiptUrl?: string
  shippingInfo?: {
    firstName: string
    lastName: string
    email: string
    address: string
    state: string
    phone: string
    area: string
  }
  createdAt: Date
  updatedAt: Date
}

// Create the schema
const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
})

const OrderSchema = new Schema<IOrder>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    totalPrice: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending", 
      index: true 
    },
    items: [OrderItemSchema],
    paymentMethod: { 
      type: String,
      enum: ["card", "transfer", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    },
    receiptUrl: { type: String },
    shippingInfo: {
      firstName: String,
      lastName: String,
      email: String,
      address: String,
      state: String,
      phone: String,
      area: String,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

// Add indexes to speed common queries and aggregations
OrderSchema.index({ createdAt: 1 })
OrderSchema.index({ createdAt: 1, status: 1 })
OrderSchema.index({ "items.productId": 1 })
OrderSchema.index({ storeId: 1 })
OrderSchema.index({ userId: 1 })
OrderSchema.index({ storeId: 1, createdAt: -1 }) // common for store recent orders

// Optional: remove __v when converting to JSON
OrderSchema.set("toJSON", {
  transform: function (doc, ret) {
    const out = ret as any; // cast to any so `delete` is allowed
    delete out.__v;
    return out;
  },
})

// ✅ Prevent recompilation issues in Next.js
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)

export default Order