import mongoose, { type Document, Schema, type Model } from "mongoose"

// TypeScript interface for the Category document
export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  storeId: mongoose.Types.ObjectId
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

// Schema definition
const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      lowercase: true, // ensure consistent casing
      maxLength: [100, "Category name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "", // always returns a string
      maxLength: [500, "Description cannot exceed 500 characters"],
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Store ID is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to ensure unique category names per store
CategorySchema.index({ name: 1, storeId: 1 }, { unique: true })
CategorySchema.index({ storeId: 1, isActive: 1 })

// Create and export the model
const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)

export default Category
