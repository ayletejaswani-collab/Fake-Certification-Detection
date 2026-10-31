import mongoose from "mongoose";

const verificationLogSchema = new mongoose.Schema(
  {
    certId: { type: String, default: "" },
    result: {
      type: String,
      enum: ["genuine", "revoked", "tampered", "not_found", "offline_valid", "offline_invalid", "fake"],
      required: true,
    },
    source: { type: String, enum: ["web", "camera", "manual", "offline", "demo", "upload"], default: "web" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    details: { type: String, default: "" },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

verificationLogSchema.index({ createdAt: -1 });
verificationLogSchema.index({ result: 1, createdAt: -1 });

export const VerificationLog = mongoose.model("VerificationLog", verificationLogSchema);
