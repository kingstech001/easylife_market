import mongoose, { Document, Model } from "mongoose"
import "./Order" // Ensure Order model is registered

// Interface for payment details
interface IPaymentDetails {
  transactionId?: string
  amount?: number
  currency?: string
  channel?: string
  fees?: number
  paidAt?: Date
}

// Interface for MainOrder
export interface IMainOrder extends Document {
  userId: mongoose.Types.ObjectId
  orderNumber: string
  reference: string
  subOrders: mongoose.Types.ObjectId[]
  totalAmount: number
  deliveryFee: number
  grandTotal: number
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    address: string
    state: string
    phone: string
    area: string
  }
  paymentMethod: string
  paymentStatus: string
  paymentDetails?: IPaymentDetails
  receiptUrl?: string
  status: string
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentDetailsSchema = new mongoose.Schema({
  transactionId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  channel: { type: String },
  fees: { type: Number },
  paidAt: { type: Date },
}, { _id: false })

const MainOrderSchema = new mongoose.Schema<IMainOrder>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    // NEW: Paystack payment reference
    reference: {
      type: String,
      required: true,
      index: true,
    },
    subOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    shippingInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      state: { type: String, required: true },
      phone: { type: String, required: true },
      area: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ["card", "transfer", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
      required: true,
    },
    // NEW: Payment status (separate from order status)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    // NEW: Detailed payment information from Paystack
    paymentDetails: PaymentDetailsSchema,
    receiptUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    // NEW: When payment was completed
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Additional indexes for better query performance
MainOrderSchema.index({ createdAt: -1 })
MainOrderSchema.index({ userId: 1, createdAt: -1 })
MainOrderSchema.index({ paymentStatus: 1, status: 1 })
MainOrderSchema.index({ reference: 1 }) // Fast lookup by payment reference

// Virtual for checking if order is fully paid
MainOrderSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === 'paid'
})

// Virtual for checking if all sub-orders are delivered
MainOrderSchema.virtual('isFullyDelivered').get(function() {
  return this.status === 'delivered'
})

// Generate unique order number
MainOrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    this.orderNumber = `ORD-${timestamp}${random}`
  }
  next()
})

// Pre-save middleware: Auto-update order status when payment succeeds
MainOrderSchema.pre('save', function(next) {
  // If payment just changed to paid and order is still pending, move to processing
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && this.status === 'pending') {
    this.status = 'processing'
  }
  next()
})

// Remove __v from JSON output
MainOrderSchema.set("toJSON", {
  transform: function (doc, ret) {
    const obj = ret as any
    delete obj.__v
    return obj
  },
})

const MainOrder: Model<IMainOrder> = 
  mongoose.models.MainOrder || mongoose.model<IMainOrder>("MainOrder", MainOrderSchema)

export default MainOrder