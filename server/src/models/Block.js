import mongoose from "mongoose";

const blockSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    certId: { type: String, required: true },
    dataHash: { type: String, required: true },
    previousHash: { type: String, required: true },
    blockHash: { type: String, required: true, unique: true },
    nonce: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Block = mongoose.model("Block", blockSchema);
