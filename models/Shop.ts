import mongoose, { Schema, Document, models } from 'mongoose';

interface IShop extends Document {
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
}

const ShopSchema = new Schema<IShop>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default models.Shop || mongoose.model<IShop>('Shop', ShopSchema);
