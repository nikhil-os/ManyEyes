import mongoose from "mongoose";

export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, { autoIndex: true });
    console.log("[DB] Connected");
  } catch (err) {
    console.error("[DB] Connection error", err);
    process.exit(1);
  }
}
