// src/models/Product.ts

import mongoose, { Schema, Document, Model } from "mongoose"

// ================== Interfaces ==================
export interface IProductImage {
  _id?: mongoose.Types.ObjectId
  url: string
  altText?: string
}

export interface IDimensions {
  length?: number
  width?: number
  height?: number
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  compareAtPrice?: number | null
  category?: string
  inventoryQuantity: number
  images: IProductImage[]
  storeId: mongoose.Types.ObjectId
  isActive: boolean // Controls storefront visibility (true = visible)
  isDeleted: boolean // Soft-delete flag
  deactivatedAt?: Date | null // When product was deactivated due to plan limit or manual action
  sku?: string
  weight?: number
  dimensions?: IDimensions
  tags: string[]
  createdAt?: Date
  updatedAt?: Date
  
  // Virtual property
  primaryImage?: string
}

// ================== Schema ==================
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
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
          // allow null/undefined OR a value strictly greater than price
          if (value === null || value === undefined) return true
          return value > this.price
        },
        message: "Compare at price should be greater than the regular price",
      },
      default: null,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: undefined,
    },
    inventoryQuantity: {
      type: Number,
      required: [true, "Inventory quantity is required"],
      min: [0, "Inventory cannot be negative"],
      default: 0,
    },
    images: {
      type: [
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
      default: [],
      validate: {
        validator: function (arr: IProductImage[]) {
          // ensure each image has a non-empty url
          return arr.every((img) => !!img && typeof img.url === "string" && img.url.length > 0)
        },
        message: "Each image must have a valid URL",
      },
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // index for quicker storefront queries
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true, // soft-delete flag
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // allow multiple docs without sku
      trim: true,
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
ProductSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 })
ProductSchema.index({ storeId: 1, createdAt: -1 })
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
  transform: (doc: IProduct, ret: any) => {
    const out: any = ret
    out.id = out._id
    delete out._id
    delete out.__v
    return out
  },
})

// ================== Middleware ==================
// Generate a reasonably unique SKU when missing.
// Format: <storeShort>-<timestampHex>-<random4>
ProductSchema.pre<IProduct>("save", function (next) {
  try {
    if (!this.sku) {
      const storePart = this.storeId ? this.storeId.toString().slice(-6) : "unknown"
      const tsHex = Date.now().toString(16)
      const rand = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .padStart(4, "0")
      this.sku = `${storePart}-${tsHex}-${rand}`
    }
    next()
  } catch (err) {
    next(err as any)
  }
})

// Optional: when a product is deactivated (isActive === false) but not deleted, set deactivatedAt
ProductSchema.pre<IProduct>("save", function (next) {
  if (this.isModified("isActive")) {
    if (!this.isActive && !this.deactivatedAt) {
      this.deactivatedAt = new Date()
    } else if (this.isActive && this.deactivatedAt) {
      // If re-activated, clear deactivatedAt
      this.deactivatedAt = null
    }
  }
  next()
})

// ================== Model ==================
// Clear cached model to ensure schema changes are applied during dev/hot-reload
const MODEL_NAME = "Product"
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME]
}

const Product: Model<IProduct> = mongoose.model<IProduct>(MODEL_NAME, ProductSchema)

export default Product