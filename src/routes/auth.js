import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { Device } from "../models/Device.js";
import { v4 as uuid } from "uuid";

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors });
  const { email, password } = parse.data;
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ error: "Email already registered" });
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ email, passwordHash });
  return res.json({ ok: true });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceName: z.string().min(1),
  deviceId: z.string().optional(),
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: parse.error.errors });
  const { email, password, deviceName, deviceId } = parse.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  const actualDeviceId = deviceId || uuid();
  let device = await Device.findOne({ deviceId: actualDeviceId });
  if (!device) {
    device = await Device.create({
      deviceId: actualDeviceId,
      email,
      deviceName,
      isOnline: true,
      lastSeen: new Date(),
    });
  } else {
    device.deviceName = deviceName;
    device.isOnline = true;
    device.lastSeen = new Date();
    await device.save();
  }
  const devices = await Device.find({ email });
  return res.json({ token, deviceId: actualDeviceId, devices });
});

export default router;
