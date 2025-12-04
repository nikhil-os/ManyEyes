import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { Device } from "../models/Device.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  const devices = await Device.find({ email: req.user.email });
  res.json(devices);
});

export default router;
