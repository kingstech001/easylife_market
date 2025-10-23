import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("⚠️ Please define the MONGODB_URI environment variable");
}

// Cache connection across module reloads (Next.js / serverless)
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalAny: any = global;

if (!globalAny._mongooseCache) {
  globalAny._mongooseCache = { conn: null, promise: null } as MongooseCache;
}

export async function connectToDB() {
  if (globalAny._mongooseCache.conn) {
    return globalAny._mongooseCache.conn;
  }

  if (!globalAny._mongooseCache.promise) {
    // optional: avoid strictQuery warnings
    mongoose.set("strictQuery", false);

    globalAny._mongooseCache.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "easylife-market",
        // recommended options (modern mongoose often doesn't need these, but safe)
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        // serverSelectionTimeoutMS: 5000,
      })
      .then((mongooseInstance) => {
        console.log("✅ Connected to MongoDB");
        globalAny._mongooseCache.conn = mongooseInstance;
        return mongooseInstance;
      })
      .catch((err: any) => {
        globalAny._mongooseCache = { conn: null, promise: null };
        console.error("❌ MongoDB connection error:", err);
        throw err;
      });
  }

  return globalAny._mongooseCache.promise;
}

export async function disconnectDB() {
  if (!globalAny._mongooseCache?.conn) {
    return;
  }

  try {
    await mongoose.disconnect();
    globalAny._mongooseCache = { conn: null, promise: null };
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ MongoDB disconnection error:", error);
    throw error;
  }
}