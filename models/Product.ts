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
  { name: "Black",  hex: "#000000" },
  { name: "White",  hex: "#FFFFFF" },
  { name: "Red",    hex: "#EF4444" },
  { name: "Blue",   hex: "#3B82F6" },
  { name: "Green",  hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink",   hex: "#EC4899" },
  { name: "Gray",   hex: "#6B7280" },
  { name: "Brown",  hex: "#92400E" },
  { name: "Navy",   hex: "#1E3A5F" },
  { name: "Beige",  hex: "#D4C4A8" },
  { name: "Cream",  hex: "#FFFDD0" },
  { name: "Maroon", hex: "#800000" },
  { name: "Teal",   hex: "#14B8A6" },
] as const

// ================== Predefined Sizes ==================
export const PREDEFINED_SIZES = {
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  shoes:    ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
  numeric:  ["6", "8", "10", "12", "14", "16", "18", "20"],
  oneSize:  ["One Size"],
} as const

// ─────────────────────────────────────────────────────────────────────────────
// Existing retail variant interfaces — UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────

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
  priceAdjustment?: number
}

export interface IDimensions {
  length?: number
  width?: number
  height?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Food modifier interfaces
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single selectable option within a modifier group.
 *
 * Examples:
 *   - Ofe Onugbu (Bitterleaf Soup)  — priceAdjustment: 200
 *   - Extra wrap                     — priceAdjustment: 150
 *   - Chicken                        — priceAdjustment: 500
 */
export interface IModifierOption {
  _id?: mongoose.Types.ObjectId
  /** Display name, e.g. "Ofe Onugbu", "Chicken", "Small" */
  name: string
  /**
   * Amount added to (positive) or subtracted from (negative) the base price.
   * Use 0 for no price change.
   */
  priceAdjustment: number
  /**
   * Optional per-option stock tracking.
   * Leave undefined if this option has unlimited availability.
   */
  inventoryQuantity?: number
  /** Whether this option is currently available for selection. */
  isActive: boolean
}

/**
 * A named group of modifier options presented to the customer at ordering time.
 *
 * Examples:
 *   - "Choose your soup"   → required, single,   min:1, max:1
 *   - "Add extra wrap?"    → optional, single,   min:0, max:1
 *   - "Add-ons"            → optional, multiple, min:0, max:3
 */
export interface IModifierGroup {
  _id?: mongoose.Types.ObjectId
  /** Display label shown to the customer, e.g. "Choose your soup" */
  name: string
  /**
   * If true the customer must make a selection before adding to cart.
   * When true + selectionType === "single", minSelection is implicitly 1.
   */
  required: boolean
  /** "single" enforces maxSelection = 1; "multiple" allows many picks. */
  selectionType: "single" | "multiple"
  /** Minimum number of options the customer must pick (≥ 0). */
  minSelection: number
  /** Maximum number of options the customer may pick (≥ minSelection). */
  maxSelection: number
  /** At least one option must exist. */
  options: IModifierOption[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended IProduct interface
// ─────────────────────────────────────────────────────────────────────────────

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
  isActive: boolean
  isDeleted: boolean
  deactivatedAt?: Date | null
  sku?: string
  weight?: number
  dimensions?: IDimensions
  tags: string[]
  createdAt?: Date
  updatedAt?: Date

  // ── Retail variants (existing, untouched) ─────────────────────────────────
  hasVariants: boolean
  variants: IProductVariant[]

  // ── Food modifier groups (new) ────────────────────────────────────────────
  /** Set to true for food/configurable products that use modifier groups. */
  hasModifiers: boolean
  /** Ordered list of modifier groups shown at ordering time. */
  modifierGroups: IModifierGroup[]

  // ── Virtuals ──────────────────────────────────────────────────────────────
  primaryImage?: string
  totalVariantQuantity?: number
}

// ================== Helper Function (unchanged) ==================
export function categorySupportsVariants(category: string | undefined): boolean {
  if (!category) return false
  const normalizedCategory = category.toLowerCase().trim()
  return VARIANT_CATEGORIES.some(
    (vc) =>
      normalizedCategory.includes(vc.toLowerCase()) ||
      vc.toLowerCase().includes(normalizedCategory)
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Existing retail variant schemas — UNCHANGED
// ─────────────────────────────────────────────────────────────────────────────

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
          url:     { type: String, required: [true, "Image URL is required"] },
          altText: { type: String, default: "" },
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

// ─────────────────────────────────────────────────────────────────────────────
// NEW: Food modifier schemas
// ─────────────────────────────────────────────────────────────────────────────

const ModifierOptionSchema = new Schema<IModifierOption>(
  {
    name: {
      type: String,
      required: [true, "Modifier option name is required"],
      trim: true,
    },
    priceAdjustment: {
      type: Number,
      required: [true, "Price adjustment is required (use 0 for no change)"],
      // can be negative (discount) or positive (surcharge)
      default: 0,
    },
    inventoryQuantity: {
      type: Number,
      min: [0, "Inventory quantity cannot be negative"],
      // intentionally optional — omit for unlimited availability
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
)

const ModifierGroupSchema = new Schema<IModifierGroup>(
  {
    name: {
      type: String,
      required: [true, "Modifier group name is required"],
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    selectionType: {
      type: String,
      enum: {
        values: ["single", "multiple"],
        message: "selectionType must be 'single' or 'multiple'",
      },
      required: [true, "selectionType is required"],
    },
    minSelection: {
      type: Number,
      min: [0, "minSelection cannot be negative"],
      default: 0,
    },
    maxSelection: {
      type: Number,
      min: [1, "maxSelection must be at least 1"],
      default: 1,
    },
    options: {
      type: [ModifierOptionSchema],
      default: [],
      validate: {
        validator: function (arr: IModifierOption[]) {
          return Array.isArray(arr) && arr.length > 0
        },
        message: "A modifier group must have at least one option",
      },
    },
  },
  {
    _id: true,
    // Cross-field validation lives here so it runs on every save/update.
    // Mongoose doesn't natively support multi-field validators on sub-schemas,
    // so we use a post-init hook on the parent instead (see below).
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// Main Product schema — variant section UNCHANGED, modifiers appended
// ─────────────────────────────────────────────────────────────────────────────

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
          url:     { type: String, required: [true, "Image URL is required"] },
          altText: { type: String, default: "" },
        },
      ],
      default: [],
      validate: {
        validator: function (arr: IProductImage[]) {
          return arr.every(
            (img) => !!img && typeof img.url === "string" && img.url.length > 0
          )
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
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width:  { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    tags: { type: [String], default: [] },

    // ── Retail variants (UNCHANGED) ──────────────────────────────────────────
    hasVariants: {
      type: Boolean,
      default: false,
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },

    // ── Food modifier groups (NEW) ───────────────────────────────────────────
    hasModifiers: {
      type: Boolean,
      default: false,
    },
    modifierGroups: {
      type: [ModifierGroupSchema],
      default: [],
      validate: {
        validator: function (this: IProduct, groups: IModifierGroup[]) {
          // Only validate cross-field rules when the product actually uses modifiers
          if (!this.hasModifiers) return true

          for (const group of groups) {
            // Rule 1: options must not be empty
            if (!group.options || group.options.length === 0) return false

            // Rule 2: single-selection → maxSelection must be 1
            if (group.selectionType === "single" && group.maxSelection !== 1) return false

            // Rule 3: required + single → minSelection must be 1
            if (group.required && group.selectionType === "single" && group.minSelection !== 1)
              return false

            // Rule 4: minSelection must be <= maxSelection
            if (group.minSelection > group.maxSelection) return false
          }

          return true
        },
        message:
          "Invalid modifier group configuration. Check selectionType, minSelection, maxSelection, and options.",
      },
    },
  },
  { timestamps: true }
)

// ================== Indexes (UNCHANGED + one new) ==================
ProductSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 })
ProductSchema.index({ storeId: 1, createdAt: -1 })
ProductSchema.index({ category: 1 })
ProductSchema.index({ name: "text", description: "text" })
ProductSchema.index({ createdAt: -1 })
// Quickly find all food/configurable products in a store
ProductSchema.index({ storeId: 1, hasModifiers: 1 })

// ================== Virtuals (UNCHANGED) ==================
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

// ================== JSON Transform (UNCHANGED) ==================
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

// ================== Middleware (UNCHANGED — all three hooks preserved) ==================

// 1. Auto-generate SKU
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

// 2. Track deactivatedAt timestamp
ProductSchema.pre<IProduct>("save", function (next) {
  if (this.isModified("isActive")) {
    if (!this.isActive && !this.deactivatedAt) {
      this.deactivatedAt = new Date()
    } else if (this.isActive && this.deactivatedAt) {
      this.deactivatedAt = null
    }
  }
  next()
})

// 3. Auto-calculate inventoryQuantity from variants
//    NOTE: modifiers intentionally do NOT contribute to this total.
ProductSchema.pre<IProduct>("save", function (next) {
  if (this.hasVariants && this.variants && this.variants.length > 0) {
    this.inventoryQuantity = this.variants.reduce((total, variant) => {
      return total + variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.quantity, 0)
    }, 0)
  }
  next()
})

// ================== Model ==================
const MODEL_NAME = "Product"
if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME]
}

const Product: Model<IProduct> = mongoose.model<IProduct>(MODEL_NAME, ProductSchema)

export default Product