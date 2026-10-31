import crypto from "crypto";
import { Block } from "../models/Block.js";

function hashBlock({ index, ts, certId, dataHash, previousHash, nonce }) {
  return crypto
    .createHash("sha256")
    .update(`${index}|${ts}|${certId}|${dataHash}|${previousHash}|${nonce}`)
    .digest("hex");
}

async function mine(blockData, difficulty = 3) {
  let nonce = 0;
  const prefix = "0".repeat(difficulty);
  let blockHash = "";
  do {
    nonce += 1;
    blockHash = hashBlock({ ...blockData, nonce });
  } while (!blockHash.startsWith(prefix));
  return { nonce, blockHash };
}

export async function ensureGenesis() {
  const existing = await Block.findOne({ index: 0 });
  if (existing) return existing;
  const timestamp = new Date();
  const data = {
    index: 0,
    ts: timestamp.getTime(),
    certId: "GENESIS",
    dataHash: "0".repeat(64),
    previousHash: "0".repeat(64),
  };
  const { nonce, blockHash } = await mine(data, 3);
  return Block.create({
    index: 0,
    timestamp,
    certId: "GENESIS",
    dataHash: data.dataHash,
    previousHash: data.previousHash,
    nonce,
    blockHash,
  });
}

export async function appendBlock(certId, dataHash) {
  await ensureGenesis();
  const last = await Block.findOne().sort({ index: -1 });
  const timestamp = new Date();
  const data = {
    index: last.index + 1,
    ts: timestamp.getTime(),
    certId,
    dataHash,
    previousHash: last.blockHash,
  };
  const { nonce, blockHash } = await mine(data, 3);
  return Block.create({
    index: data.index,
    timestamp,
    certId,
    dataHash,
    previousHash: data.previousHash,
    nonce,
    blockHash,
  });
}

export async function validateChain() {
  const blocks = await Block.find().sort({ index: 1 });
  if (!blocks.length) return { valid: true, length: 0, brokenAt: null };
  for (let i = 1; i < blocks.length; i += 1) {
    const prev = blocks[i - 1];
    const curr = blocks[i];
    const recomputed = hashBlock({
      index: curr.index,
      ts: new Date(curr.timestamp).getTime(),
      certId: curr.certId,
      dataHash: curr.dataHash,
      previousHash: curr.previousHash,
      nonce: curr.nonce,
    });
    if (curr.previousHash !== prev.blockHash) {
      return { valid: false, length: blocks.length, brokenAt: curr.index, reason: "link_break" };
    }
    if (recomputed !== curr.blockHash) {
      return { valid: false, length: blocks.length, brokenAt: curr.index, reason: "hash_mismatch" };
    }
  }
  return { valid: true, length: blocks.length, brokenAt: null };
}

export async function getChain(limit = 50) {
  const blocks = await Block.find().sort({ index: -1 }).limit(limit);
  const integrity = await validateChain();
  return { blocks, integrity };
}
