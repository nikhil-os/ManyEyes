import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import devicesRoutes from "./routes/devices.js";
import { Device } from "./models/Device.js";
import { decodeToken } from "./middleware/auth.js";
import { MessageTypes, makeMessage } from "./utils/messages.js";
import { WebSocketServer, WebSocket } from "ws";

const app = express();
app.use(cors());
app.use(express.json());

// Simple root route so Render shows something at '/'
app.get("/", (_, res) => res.send("ManyEyes Backend Running"));
app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/devices", devicesRoutes);

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// deviceId -> ws
const connections = new Map();

function broadcastToGroup(email, msgObj) {
  const raw = JSON.stringify(msgObj);
  for (const [deviceId, ws] of connections.entries()) {
    if (ws.email === email && ws.readyState === WebSocket.OPEN) {
      ws.send(raw);
    }
  }
}

wss.on("connection", async (ws, req) => {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const token = params.get("token");
  const deviceId = params.get("deviceId");
  const decoded = decodeToken(token);
  if (!decoded || !deviceId) {
    ws.close();
    return;
  }
  ws.email = decoded.email;
  ws.deviceId = deviceId;
  connections.set(deviceId, ws);
  // Mark device online
  await Device.findOneAndUpdate(
    { deviceId },
    { isOnline: true, lastSeen: new Date() }
  );
  broadcastToGroup(ws.email, {
    type: MessageTypes.PRESENCE,
    deviceId,
    online: true,
  });

  ws.on("message", async (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    const { type, toDeviceId } = msg;
    console.log(
      `[WS] RX type=${type} from=${deviceId} to=${toDeviceId} bytes=${
        typeof data === "string" ? data.length : Buffer.byteLength(data)
      }`
    );
    if (!Object.values(MessageTypes).includes(type)) return;
    // Relay targeted messages
    if (toDeviceId) {
      const target = connections.get(toDeviceId);
      if (target && target.readyState === WebSocket.OPEN) {
        const payload = { ...msg, fromDeviceId: deviceId };
        try {
          target.send(JSON.stringify(payload));
          console.log(
            `[WS] Relay ${type} from=${deviceId} to=${toDeviceId} len=${
              JSON.stringify(payload).length
            }`
          );
        } catch (e) {
          console.error(`[WS] Relay failed ${type} to=${toDeviceId}:`, e);
        }
      } else {
        console.warn(
          `[WS] No open socket for toDeviceId=${toDeviceId}; type=${type}`
        );
      }
    }
    // Update status for stream start/stop
    if (type === MessageTypes.REQUEST_STREAM) {
      // Viewer requesting remote device to start stream; remote will respond with OFFER
    } else if (type === MessageTypes.STOP_STREAM) {
      await Device.findOneAndUpdate(
        { deviceId },
        { "currentStatus.cameraOn": false, "currentStatus.audioOn": false }
      );
    } else if (type === MessageTypes.SWITCH_CAMERA) {
      // Target device will handle and then update status
    }
  });

  ws.on("close", async () => {
    connections.delete(deviceId);
    await Device.findOneAndUpdate(
      { deviceId },
      { isOnline: false, lastSeen: new Date() }
    );
    broadcastToGroup(ws.email, {
      type: MessageTypes.PRESENCE,
      deviceId,
      online: false,
    });
  });
});

// On Render, process.env.PORT is provided; default to 10000 locally if not set
const PORT = process.env.PORT || 10000;

async function start() {
  await connectDB(process.env.MONGO_URI);
  server.listen(PORT, () => console.log(`[Server] Listening on ${PORT}`));
}

start();
