import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: "buyer" | "seller" | "admin";
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
  },
  { timestamps: true }
);

export default models.User || mongoose.model<IUser>("User", userSchema);
