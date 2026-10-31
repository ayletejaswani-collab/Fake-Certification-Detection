import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["email", "sms"], required: true },
    to: { type: String, required: true },
    subject: { type: String, default: "" },
    body: { type: String, required: true },
    status: { type: String, enum: ["sent", "logged", "failed"], default: "logged" },
    certId: { type: String, default: "" },
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
