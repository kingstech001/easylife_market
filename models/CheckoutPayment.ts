import mongoose, { Schema, type Document, type Model } from "mongoose"

export interface ICheckoutPayment extends Document {
  reference: string
  userId: mongoose.Types.ObjectId | string
  userEmail?: string
  orders: any
  shippingInfo: any
  deliveryFee: number
  paymentMethod: string
  amount: number
  status: "initialized" | "paid" | "failed"
  createdAt: Date
  updatedAt: Date
}

const CheckoutPaymentSchema = new Schema<ICheckoutPayment>(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true,
    },
    userEmail: String,
    orders: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
    shippingInfo: {
      type: Schema.Types.Mixed,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "card",
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["initialized", "paid", "failed"],
      default: "initialized",
      index: true,
    },
  },
  { timestamps: true },
)

CheckoutPaymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 })

const CheckoutPayment: Model<ICheckoutPayment> =
  mongoose.models.CheckoutPayment ||
  mongoose.model<ICheckoutPayment>("CheckoutPayment", CheckoutPaymentSchema)

export default CheckoutPayment
