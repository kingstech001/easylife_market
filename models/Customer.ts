import { Schema, Document, models, model } from "mongoose"

export interface ICustomer extends Document {
  name: string
  email: string
  orders: number
  totalSpent: number
  lastOrder: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    orders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrder: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
)

export default models.Customer || model<ICustomer>("Customer", CustomerSchema)
