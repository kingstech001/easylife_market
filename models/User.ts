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
  resetPasswordToken?: string; // Hashed reset token
  resetPasswordExpires?: Date; // Expiry for reset token
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { 
      type: String, 
      required: true 
    },
    lastName: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    },
    password: { 
      type: String, 
      required: true,
      select: false // Don't return password by default
    },
    role: { 
      type: String, 
      enum: ["buyer", "seller", "admin"], 
      default: "buyer" 
    },
    verified: { 
      type: Boolean, 
      default: false 
    },
    verificationCode: {
      type: String,
      select: false // Don't return verification code by default
    },
    codeExpires: {
      type: Date,
      select: false // Don't return expiry by default
    },
    resetPasswordToken: {
      type: String,
      select: false // Don't return reset token by default
    },
    resetPasswordExpires: {
      type: Date,
      select: false // Don't return reset token expiry by default
    },
  },
  { 
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ verificationCode: 1 });

// Method to check if reset token is expired
userSchema.methods.isResetTokenExpired = function(): boolean {
  if (!this.resetPasswordExpires) return true;
  return this.resetPasswordExpires < new Date();
};

// Method to check if verification code is expired
userSchema.methods.isVerificationCodeExpired = function(): boolean {
  if (!this.codeExpires) return true;
  return this.codeExpires < new Date();
};

export default models.User || mongoose.model<IUser>("User", userSchema);