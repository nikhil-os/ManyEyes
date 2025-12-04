export const MessageTypes = {
  REQUEST_STREAM: "REQUEST_STREAM",
  OFFER: "OFFER",
  ANSWER: "ANSWER",
  ICE: "ICE",
  SWITCH_CAMERA: "SWITCH_CAMERA",
  STOP_STREAM: "STOP_STREAM",
  PRESENCE: "PRESENCE",
};

export function makeMessage(type, data = {}) {
  return JSON.stringify({ type, ...data });
}
