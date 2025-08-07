import type { Types } from "mongoose";

// User reference when populated
export interface IUserRef {
  readonly _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: "buyer" | "seller";
}

// Product document (from .lean())
export interface IProduct {
  readonly _id: Types.ObjectId;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images?: string[];
  stock: number;
  sellerId: Types.ObjectId | IUserRef;
  rating?: number;
  reviewCount?: number;
  salesCount?: number;
  isActive?: boolean;
  tags?: string[];
  specifications?: { key: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

// Order item
export interface IOrderItem {
  productId: Types.ObjectId | IProduct;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Order document (from .lean())
export interface IOrder {
  readonly _id: Types.ObjectId;
  orderId?: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shipping?: number;
  tax?: number;
  total: number;
  status?: "Processing" | "Confirmed" | "Shipped" | "In Transit" | "Delivered" | "Cancelled";
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  paymentMethod: "card" | "bank_transfer" | "wallet";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  createdAt: Date;
  updatedAt: Date;
}
