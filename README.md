# Backend (ManyEyes)

Express + MongoDB Atlas + WebSocket signaling server.

## Install

```powershell
cd backend
npm install
npm run dev
```

Environment file `backend/.env` (already created):

```
PORT=4000
MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET=<long random string>
```

This project is configured to use MongoDB Atlas directly; Docker is not required.

## Auth

- POST /auth/register { email, password }
- POST /auth/login { email, password, deviceName, deviceId? }
  - Returns { token, deviceId, devices[] }

## WebSocket

Connect to: `ws://HOST:PORT/ws?token=JWT&deviceId=DEVICE_ID`

Message envelope examples:

```json
{
  "type": "REQUEST_STREAM",
  "toDeviceId": "target-device-id"
}
{
  "type": "OFFER",
  "toDeviceId": "viewer-device-id",
  "sdp": "..."
}
{
  "type": "ANSWER",
  "toDeviceId": "streamer-device-id",
  "sdp": "..."
}
{
  "type": "ICE",
  "toDeviceId": "other-device-id",
  "candidate": { "candidate": "...", "sdpMid": "0", "sdpMLineIndex": 0 }
}
{
  "type": "SWITCH_CAMERA",
  "toDeviceId": "streamer-device-id",
  "camera": "front" // or "back"
}
{
  "type": "STOP_STREAM",
  "toDeviceId": "streamer-device-id"
}
```

Presence broadcast:

```json
{ "type": "PRESENCE", "deviceId": "abc", "online": true }
```

## Status Updates

Device status changes can be persisted by emitting messages and updating Device document.

## TODO

- Add rate limiting / validation hardening
- Add optional TURN server integration for NAT traversal
