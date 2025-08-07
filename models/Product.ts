import mongoose, { type Document, Schema, type Model } from "mongoose"

// TypeScript interface for the Product document
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  price: number
  compareAtPrice?: number
  categoryId?: mongoose.Types.ObjectId
  inventoryQuantity: number
  images: {
    _id?: mongoose.Types.ObjectId
    url: string
    altText?: string
  }[]
  storeId: mongoose.Types.ObjectId
  isActive: boolean
  isDeleted: boolean
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

// Schema definition
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
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
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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
      length: Number,
      width: Number,
      height: Number,
    },
    tags: [String],
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
ProductSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 })
ProductSchema.index({ categoryId: 1 })
ProductSchema.index({ name: "text", description: "text" })

// Pre-save middleware
ProductSchema.pre<IProduct>("save", function (next) {
  if (!this.sku) {
    this.sku = `${this.storeId.toString().slice(-6)}-${Date.now()}`
  }
  next()
})

// Create and export the model
const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)

export default Product
