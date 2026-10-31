import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    course: { type: String, required: true, trim: true },
    issueDate: { type: String, required: true },
    issuer: { type: String, required: true },
    issuerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    template: { type: String, enum: ["academic", "workshop", "internship"], default: "academic" },
    sealShape: { type: String, enum: ["round", "square"], default: "round" },
    grade: { type: String, default: "" },
    hash: { type: String, required: true },
    signature: { type: String, required: true },
    status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
    revokedAt: { type: Date },
    revokeReason: { type: String, default: "" },
    qrPayload: { type: String, required: true },
    pdfPath: { type: String, default: "" },
    chainIndex: { type: Number, default: -1 },
    chainHash: { type: String, default: "" },
    ethTxHash: { type: String, default: "" },
    ethNetwork: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model("Certificate", certificateSchema);
