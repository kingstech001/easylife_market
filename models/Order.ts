import mongoose, { Schema, Document } from "mongoose"

export interface ISelectedVariant {
  color?: {
    name: string
    hex: string
  }
  size?: string
}

export interface IOrderItem {
  productId: mongoose.Types.ObjectId
  productName: string
  quantity: number
  priceAtPurchase: number
  selectedVariant?: ISelectedVariant
}

export interface IOrder extends Document {
  storeId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  reference: string
  totalPrice: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  paymentStatus: "pending" | "paid" | "failed" | "refunded"
  paymentMethod: string
  paidAt?: Date
  paymentDetails?: {
    transactionId?: string
    amount?: number
    currency?: string
    channel?: string
    fees?: number
    paidAt?: Date
  }
  items: IOrderItem[]
  shippingInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    state: string
    area: string
  }
  trackingNumber?: string
  cancelledAt?: Date
  cancellationReason?: string
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      index: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    paymentDetails: {
      transactionId: String,
      amount: Number,
      currency: String,
      channel: String,
      fees: Number,
      paidAt: Date,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
          min: 0,
        },
        selectedVariant: {
          color: {
            name: String,
            hex: String,
          },
          size: String,
        },
      },
    ],
    shippingInfo: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
      address: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      area: {
        type: String,
        required: true,
      },
    },
    trackingNumber: {
      type: String,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

// SECURITY: Compound index to prevent duplicate orders for same store+reference
OrderSchema.index({ storeId: 1, reference: 1 }, { unique: true })

// Index for common queries
OrderSchema.index({ userId: 1, createdAt: -1 })
OrderSchema.index({ storeId: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema)

export default Order
