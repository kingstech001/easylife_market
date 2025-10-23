import mongoose, { Schema, type Document } from "mongoose"
import slugify from "slugify" // Import slugify

export interface IStore extends Document {
  name: string
  slug: string // Added slug field
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: mongoose.Types.ObjectId
  isApproved: boolean
  categories?: string[]
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const StoreSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, index: true }, // Added slug to schema
    description: { type: String },
    logo_url: { type: String },
    banner_url: { type: String },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    categories: [{ type: String }],
  },
  {
    timestamps: true,
  },
)

// Pre-save hook to generate slug from name
StoreSchema.pre("save", function (next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name as string, { lower: true, strict: true })
  }
  next()
})

const Store = mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema)

export default Store
