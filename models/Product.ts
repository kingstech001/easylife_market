// src/models/Product.ts

import mongoose, { Schema, Document, Model } from "mongoose"

// ================== Categories that support variants ==================
export const VARIANT_CATEGORIES = [
  "Clothing",
  "Fashion",
  "Apparel",
  "Shoes",
  "Footwear",
  "Accessories",
  "Jewelry",
  "Bags",
  "Sportswear",
  "Underwear",
  "Swimwear",
] as const

// ================== Predefined Colors ==================
export const PREDEFINED_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" },
  { name: "Beige", hex: "#D4C4A8" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Maroon", hex: "#800000" },
  { name: "Teal", hex: "#14B8A6" },
] as const

// ================== Predefined Sizes ==================
export const PREDEFINED_SIZES = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  shoes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  numeric: ["6", "8", "10", "12", "14", "16", "18", "20"],
  oneSize: ["One Size"],
} as const

// ================== Interfaces ==================
export interface IProductImage {
  _id?: mongoose.Types.ObjectId
  url: string
  altText?: string
}

export interface IColorVariant {
  _id?: mongoose.Types.ObjectId
  name: string
  hex: string
}

export interface ISizeVariant {
  _id?: mongoose.Types.ObjectId
  size: string
  quantity: number
}

export interface IProductVariant {
  _id?: mongoose.Types.ObjectId
  color: IColorVariant
  sizes: ISizeVariant[]
  images?: IProductImage[]
  priceAdjustment?: number // +/- adjustment from base price
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
  
  // Variant fields
  hasVariants: boolean
  variants: IProductVariant[]
  
  // Virtual property
  primaryImage?: string
  totalVariantQuantity?: number
}

// ================== Helper Function ==================
export function categorySupportsVariants(category: string | undefined): boolean {
  if (!category) return false
  const normalizedCategory = category.toLowerCase().trim()
  return VARIANT_CATEGORIES.some(
    (vc) => normalizedCategory.includes(vc.toLowerCase()) || vc.toLowerCase().includes(normalizedCategory)
  )
}

// ================== Schema ==================
const ColorVariantSchema = new Schema<IColorVariant>(
  {
    name: {
      type: String,
      required: [true, "Color name is required"],
      trim: true,
    },
    hex: {
      type: String,
      required: [true, "Color hex code is required"],
      match: [/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code"],
    },
  },
  { _id: true }
)

const SizeVariantSchema = new Schema<ISizeVariant>(
  {
    size: {
      type: String,
      required: [true, "Size is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
  },
  { _id: true }
)

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    color: {
      type: ColorVariantSchema,
      required: [true, "Color is required for variant"],
    },
    sizes: {
      type: [SizeVariantSchema],
      required: [true, "At least one size is required"],
      validate: {
        validator: function (arr: ISizeVariant[]) {
          return arr && arr.length > 0
        },
        message: "At least one size variant is required",
      },
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
    },
    priceAdjustment: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
)

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
    // Variant fields
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
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

ProductSchema.virtual("totalVariantQuantity").get(function (this: IProduct) {
  if (!this.hasVariants || !this.variants || this.variants.length === 0) {
    return this.inventoryQuantity
  }
  return this.variants.reduce((total, variant) => {
    return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0)
  }, 0)
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

// Update inventoryQuantity based on variants if hasVariants is true
ProductSchema.pre<IProduct>("save", function (next) {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    this.inventoryQuantity = this.variants.reduce((total, variant) => {
      return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0)
    }, 0)
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
