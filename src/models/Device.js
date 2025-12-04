import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    deviceName: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    currentStatus: {
      cameraOn: { type: Boolean, default: false },
      audioOn: { type: Boolean, default: false },
      usingFrontCamera: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Device = mongoose.model("Device", deviceSchema);
