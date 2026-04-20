import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IStoreReview extends Document {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreReviewSchema = new Schema<IStoreReview>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

StoreReviewSchema.index({ storeId: 1, userId: 1 }, { unique: true });
StoreReviewSchema.index({ storeId: 1, createdAt: -1 });

const StoreReview: Model<IStoreReview> =
  mongoose.models.StoreReview ||
  mongoose.model<IStoreReview>("StoreReview", StoreReviewSchema);

export default StoreReview;
