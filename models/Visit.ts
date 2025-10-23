import mongoose, { Schema, Document, Model } from "mongoose"

export interface IVisit extends Document {
  storeId: mongoose.Types.ObjectId
  userId?: mongoose.Types.ObjectId | null
  ip?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const VisitSchema = new Schema<IVisit>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: false },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
)

// indexes to speed store lookups
VisitSchema.index({ storeId: 1, createdAt: -1 })

const Visit: Model<IVisit> = mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema)

export default Visit
