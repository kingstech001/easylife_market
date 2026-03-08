// src/models/Store.ts
import mongoose, { Schema, type Document, type Model } from "mongoose";
import slugify from "slugify";

// Plan -> default product limit mapping
export const PLAN_PRODUCT_LIMIT: Record<string, number | null> = {
  free: 10,
  basic: 20,
  standard: 50,
  premium: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Business Hours types
// ─────────────────────────────────────────────────────────────────────────────

export interface IDaySchedule {
  open: boolean;
  openTime: string;  // 24h "HH:MM", e.g. "09:00"
  closeTime: string; // 24h "HH:MM", e.g. "18:00"
}

export interface IBusinessHours {
  monday:    IDaySchedule;
  tuesday:   IDaySchedule;
  wednesday: IDaySchedule;
  thursday:  IDaySchedule;
  friday:    IDaySchedule;
  saturday:  IDaySchedule;
  sunday:    IDaySchedule;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store document interface
// ─────────────────────────────────────────────────────────────────────────────

export interface IStore extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  sellerId: mongoose.Types.ObjectId;
  email?: string;
  /** Primary contact / WhatsApp-enabled phone number */
  phone?: string;
  isApproved: boolean;
  categories?: string[];
  isPublished: boolean;
  productLimit?: number | null;
  subscriptionPlan: "free" | "basic" | "standard" | "premium";
  subscriptionStatus?: "active" | "inactive" | "expired" | "cancelled";
  subscriptionExpiryDate?: Date;
  subscriptionStartDate?: Date | null;
  lastPaymentAmount?: number;
  lastPaymentReference?: string;
  lastPaymentDate?: Date;
  location: {
    type: "Point";
    coordinates: [number, number];
    address: string;
    city?: string;
    state?: string;
    country: string;
  };
  /** Per-day opening & closing schedule */
  businessHours?: IBusinessHours;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Hours sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const DayScheduleSchema = new Schema<IDaySchedule>(
  {
    open:      { type: Boolean, default: false },
    openTime:  { type: String,  default: "09:00" },
    closeTime: { type: String,  default: "18:00" },
  },
  { _id: false },
);

const BusinessHoursSchema = new Schema<IBusinessHours>(
  {
    monday:    { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "09:00", closeTime: "18:00" }) },
    tuesday:   { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "09:00", closeTime: "18:00" }) },
    wednesday: { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "09:00", closeTime: "18:00" }) },
    thursday:  { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "09:00", closeTime: "18:00" }) },
    friday:    { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "09:00", closeTime: "18:00" }) },
    saturday:  { type: DayScheduleSchema, default: () => ({ open: true,  openTime: "10:00", closeTime: "16:00" }) },
    sunday:    { type: DayScheduleSchema, default: () => ({ open: false, openTime: "10:00", closeTime: "16:00" }) },
  },
  { _id: false },
);

// ─────────────────────────────────────────────────────────────────────────────
// Main schema
// ─────────────────────────────────────────────────────────────────────────────

const StoreSchema = new Schema<IStore>(
  {
    name:        { type: String, required: true, unique: true },
    // ✅ unique:true already creates an index — no need for StoreSchema.index({ slug: 1 }) below
    slug:        { type: String, unique: true },
    description: { type: String },
    logo_url:    { type: String },
    banner_url:  { type: String },
    sellerId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    email:       { type: String },

    // ── Contact ───────────────────────────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // ── Status & publishing ───────────────────────────────────────────────────
    isPublished: { type: Boolean, default: false },
    isApproved:  { type: Boolean, default: false },
    categories:  [{ type: String }],

    // ── Subscription ──────────────────────────────────────────────────────────
    productLimit: {
      type: Number,
      default: PLAN_PRODUCT_LIMIT["free"],
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "standard", "premium"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled"],
      default: "inactive",
    },
    subscriptionExpiryDate:  { type: Date },
    subscriptionStartDate:   { type: Date, default: null },
    lastPaymentAmount:       { type: Number },
    // ✅ index:true already creates an index — no need for StoreSchema.index({ lastPaymentReference: 1 }) below
    lastPaymentReference:    { type: String, index: true },
    lastPaymentDate:         { type: Date },

    // ── Location ──────────────────────────────────────────────────────────────
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: false,
        default: [0, 0],
      },
      address: {
        type: String,
        required: true,
      },
      city:    { type: String, default: "Enugu"   },
      state:   { type: String, default: "Enugu"   },
      country: { type: String, default: "Nigeria" },
    },

    // ── Business hours ────────────────────────────────────────────────────────
    businessHours: {
      type:    BusinessHoursSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Pre-save hook — ONLY handles slug and geocoding
// productLimit is ONLY managed by webhook
// ─────────────────────────────────────────────────────────────────────────────

StoreSchema.pre<IStore>("save", async function (next) {
  try {
    // Generate slug if name changed
    if (this.isModified("name") || !this.slug) {
      this.slug = slugify(this.name, { lower: true, strict: true });
    }

    // Geocode location if needed
    const needsGeocoding =
      this.isModified("location") &&
      (!this.location.coordinates ||
        this.location.coordinates.length !== 2 ||
        isNaN(this.location.coordinates[0]) ||
        isNaN(this.location.coordinates[1]) ||
        (this.location.coordinates[0] === 0 &&
          this.location.coordinates[1] === 0));

    if (needsGeocoding) {
      try {
        const address = this.location.address ?? "";
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1`;
        const response = await fetch(url, {
          headers: { "User-Agent": "EasyLifeMarketplace/1.0" },
        });

        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          this.location = {
            type: "Point",
            coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
            address: result.display_name,
            city:
              result.address?.city ||
              result.address?.town ||
              result.address?.village,
            state:   result.address?.state,
            country: result.address?.country || "Nigeria",
          } as IStore["location"];
        }
      } catch (geocodeError) {
        console.error("Geocoding error:", geocodeError);
      }
    }

    next();
  } catch (error) {
    console.error("Pre-save hook error:", error);
    next(error as Error);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ✅ slug and lastPaymentReference are intentionally NOT listed here because
//    they are already indexed via unique:true / index:true on their field
//    definitions above. Duplicating them causes Mongoose warnings.
// ─────────────────────────────────────────────────────────────────────────────

StoreSchema.index({ "location.coordinates": "2dsphere" }); // geospatial
StoreSchema.index({ sellerId: 1 });
StoreSchema.index({ isPublished: 1, isApproved: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// Model
// ─────────────────────────────────────────────────────────────────────────────

const Store: Model<IStore> =
  mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema);

export default Store;