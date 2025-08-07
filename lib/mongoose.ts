import mongoose, { type Mongoose } from "mongoose" // Import Mongoose type

const MONGODB_URI = process.env.MONGODB_URI || ""

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local")
}

// Extend the global object to store the cached connection
declare global {
  var myMongoose: { conn: Mongoose | null; promise: Promise<Mongoose> | null }
}

let cached = global.myMongoose

if (!cached) {
  cached = global.myMongoose = { conn: null, promise: null }
}

export async function connectToDB() {
  // Changed to named export connectToDB
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Recommended for serverless environments
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((myMongoose) => {
      return myMongoose
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
