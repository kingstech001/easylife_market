import mongoose, { Schema, Document, Model } from "mongoose"

interface IOrderItem {
  productName: string
  productId: mongoose.Types.ObjectId
  quantity: number
  priceAtPurchase: number
}

interface IPaymentDetails {
  transactionId?: string
  amount?: number
  currency?: string
  channel?: string
  fees?: number
  paidAt?: Date
}

export interface IOrder extends Document {
  storeId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  totalPrice: number
  status: string
  paymentStatus: string
  reference: string
  items: IOrderItem[]
  paymentMethod?: string
  paymentDetails?: IPaymentDetails
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
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const OrderItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  priceAtPurchase: { type: Number, required: true },
})

const PaymentDetailsSchema = new Schema({
  transactionId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  channel: { type: String },
  fees: { type: Number },
  paidAt: { type: Date },
}, { _id: false })

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
    
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      required: true,
      index: true
    },
    
    reference: {
      type: String,
      required: true,
      index: true
    },
    
    items: [OrderItemSchema],
    
    paymentMethod: { 
      type: String,
      enum: ["card", "transfer", "bank", "ussd", "qr", "mobile_money", "bank_transfer"],
    },
    
    paymentDetails: PaymentDetailsSchema,
    
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
    
    paidAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
)

OrderSchema.index({ createdAt: 1 })
OrderSchema.index({ createdAt: 1, status: 1 })
OrderSchema.index({ createdAt: 1, paymentStatus: 1 })
OrderSchema.index({ "items.productId": 1 })
OrderSchema.index({ storeId: 1 })
OrderSchema.index({ userId: 1 })
OrderSchema.index({ storeId: 1, createdAt: -1 })
OrderSchema.index({ reference: 1 })
OrderSchema.index({ paymentStatus: 1, status: 1 })

OrderSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === 'paid'
})

OrderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status) && this.paymentStatus !== 'paid'
})

OrderSchema.set("toJSON", {
  transform: function (doc, ret) {
    const out = ret as any
    delete out.__v
    return out
  },
})

OrderSchema.pre('save', function(next) {
  if (this.isModified('paymentStatus') && this.paymentStatus === 'paid' && this.status === 'pending') {
    this.status = 'processing'
  }
  next()
})

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)

export default Order