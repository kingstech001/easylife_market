import mongoose, { Schema, Document, models } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "buyer" | "seller" | "admin";
  verified: boolean;
  verificationCode?: string; // Temporary OTP
  codeExpires?: Date; // Expiry for OTP
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["buyer", "seller", "admin"], default: "buyer" },
    verified: { type: Boolean, default: false },
    verificationCode: String, // Temporary OTP
    codeExpires: Date,        // Expiry for OTP
  },
  { timestamps: true }
);

export default models.User || mongoose.model<IUser>("User", userSchema);
