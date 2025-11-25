import mongoose, { Schema, type Document, type Model } from "mongoose"
import slugify from "slugify"

// Define the interface for the Store document
export interface IStore extends Document {
  name: string
  slug: string
  description?: string
  logo_url?: string
  banner_url?: string
  sellerId: mongoose.Types.ObjectId
  email?: string // Optional email field for store contact
  isApproved: boolean
  categories?: string[]
  isPublished: boolean
  subscriptionPlan: "free" | "basic" | "standard" | "premium"
  subscriptionStartDate?: Date | null // Allow null for proper type handling
  subscriptionEndDate?: Date | null   // Allow null for proper type handling
  location: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
    address: string
    city?: string
    state?: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}

const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String },
    logo_url: { type: String },
    banner_url: { type: String },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String }, // Optional store contact email
    isPublished: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    categories: [{ type: String }],
    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "standard", "premium"],
      default: "free",
    },
    subscriptionStartDate: { type: Date, default: null },
    subscriptionEndDate: { type: Date, default: null },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: String,
      state: String,
      country: String,
    },
  },
  {
    timestamps: true,
  }
)

// Pre-save hook with proper typing
StoreSchema.pre<IStore>("save", async function (next) {
  try {
    // Generate slug if name changed
    if (this.isModified("name") || !this.slug) {
      this.slug = slugify(this.name, { lower: true, strict: true })
    }

    // Geocode location if it's being modified and doesn't have valid coordinates
    // Check if coordinates exist and are valid [lng, lat] pair
    const needsGeocoding = this.isModified("location") && (
      !this.location.coordinates || 
      (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0) || // Check for [0, 0]
      isNaN(this.location.coordinates[0]) || 
      isNaN(this.location.coordinates[1])
    )

    if (needsGeocoding) {
      try {
        const address = this.location.address
        
        // Call geocoding API
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
        const response = await fetch(url, {
          headers: { "User-Agent": "EasyLifeMarketplace/1.0" },
        })
        
        if (!response.ok) {
          throw new Error(`Geocoding API error: ${response.status}`)
        }
        
        const data = await response.json()

        if (data && data.length > 0) {
          const result = data[0]
          this.location = {
            type: "Point",
            coordinates: [parseFloat(result.lon), parseFloat(result.lat)],
            address: result.display_name,
            city: result.address?.city || result.address?.town || result.address?.village,
            state: result.address?.state,
            country: result.address?.country || "Nigeria",
          }
          console.log(`✅ Geocoded: ${this.name} → [${this.location.coordinates}]`)
        } else {
          // Fallback to default Lagos coordinates if geocoding fails
          console.warn(`⚠️  Could not geocode: ${address}, using default location`)
          this.location = {
            type: "Point",
            coordinates: [3.3792, 6.5244],
            address: address,
            city: "Lagos",
            state: "Lagos",
            country: "Nigeria",
          }
        }
      } catch (geocodeError) {
        console.error("Geocoding error:", geocodeError)
        // Fallback to default location
        this.location = {
          type: "Point",
          coordinates: [3.3792, 6.5244],
          address: this.location.address,
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
        }
      }
    }

    next()
  } catch (error) {
    console.error("Pre-save hook error:", error)
    next(error as Error)
  }
})

// Create geospatial index for location-based queries
StoreSchema.index({ "location.coordinates": "2dsphere" })

// Additional useful indexes
StoreSchema.index({ sellerId: 1 })
StoreSchema.index({ slug: 1 })
StoreSchema.index({ isPublished: 1, isApproved: 1 })

// Type-safe model
const Store: Model<IStore> = mongoose.models.Store || mongoose.model<IStore>("Store", StoreSchema)

export default Store