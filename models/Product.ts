// src/models/Product.ts

import mongoose, { Schema, Document, Model } from "mongoose"

// ================== Interfaces ==================
export interface IProductImage {
  _id?: mongoose.Types.ObjectId
  url: string
  altText?: string
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  compareAtPrice?: number
  category?: string
  inventoryQuantity: number
  images: IProductImage[]
  storeId: mongoose.Types.ObjectId
  isActive: boolean // ✅ Controls visibility based on subscription
  isDeleted: boolean // ✅ Soft delete flag
  deactivatedAt?: Date | null // ✅ NEW: Track when product was deactivated
  sku?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// ================== Schema ==================
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxLength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare at price cannot be negative"],
      validate: {
        validator: function (this: IProduct, value: number) {
          return !value || value > this.price
        },
        message: "Compare at price should be greater than regular price",
      },
    },
    category: {
      type: String,
      required: false,
      trim: true,
    },
    inventoryQuantity: {
      type: Number,
      required: [true, "Inventory quantity is required"],
      min: [0, "Inventory cannot be negative"],
      default: 0,
    },
    images: [
      {
        url: {
          type: String,
          required: [true, "Image URL is required"],
        },
        altText: {
          type: String,
          default: "",
        },
      },
    ],
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // ✅ Index for faster queries
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // ✅ Index for faster queries
    },
    deactivatedAt: {
      type: Date,
      default: null, // ✅ NEW: Tracks when product was deactivated due to plan limit
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

// ================== Indexes ==================
ProductSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 }) // ✅ Compound index for queries
ProductSchema.index({ storeId: 1, createdAt: -1 }) // ✅ For sorting by creation date
ProductSchema.index({ category: 1 })
ProductSchema.index({ name: "text", description: "text" })
ProductSchema.index({ createdAt: -1 })

// ================== Virtuals ==================
ProductSchema.virtual("primaryImage").get(function (this: IProduct) {
  return this.images && this.images.length > 0 ? this.images[0].url : undefined
})

// ================== JSON Transform ==================
ProductSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    const out: any = ret
    out.id = out._id
    delete out._id
    delete out.__v
    return out
  },
})

// ================== Middleware ==================
ProductSchema.pre<IProduct>("save", function (next) {
  if (!this.sku) {
    this.sku = `${this.storeId.toString().slice(-6)}-${Date.now()}`
  }
  next()
})

// ================== Model ==================
// Clear cached model to ensure schema changes are applied
if (mongoose.models.Product) {
  delete mongoose.models.Product
}

const Product: Model<IProduct> = mongoose.model<IProduct>("Product", ProductSchema)

export default Product