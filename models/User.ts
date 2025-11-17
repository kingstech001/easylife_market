import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "buyer" | "seller" | "admin";
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: false,
    },
    verificationTokenExpires: {
      type: Date,
      required: false,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a single compound index
userSchema.index({ email: 1 }, { unique: true });

// Pre-save hook to hash password only during registration
userSchema.pre("save", async function (next) {
  // Only hash password if it's being modified during initial registration
  // Skip hashing if password is already a bcrypt hash (for password resets)
  if (!this.isModified("password")) {
    return next();
  }

  // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
  const isBcryptHash = /^\$2[aby]\$/.test(this.password);
  
  if (isBcryptHash) {
    console.log("⚠️ Password is already hashed, skipping hash in pre-save hook");
    return next();
  }

  console.log("🔒 Hashing password in pre-save hook");
  const bcrypt = require("bcryptjs");
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;