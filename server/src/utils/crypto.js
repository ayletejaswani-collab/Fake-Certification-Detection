import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_DIR = path.join(__dirname, "../../keys");
const PRIVATE_PATH = path.join(KEY_DIR, "alits-ed25519-private.pem");
const PUBLIC_PATH = path.join(KEY_DIR, "alits-ed25519-public.pem");

export const SEAL_SHAPES = ["round", "square"];

/**
 * The exact string that is hashed and signed. The seal shape is part of it,
 * so a forger cannot swap a round seal for a square one on a genuine record.
 */
export function canonicalPayload({ certId, name, course, issueDate, issuer, template, sealShape }) {
  return [
    certId,
    String(name || "").trim(),
    String(course || "").trim(),
    issueDate,
    String(issuer || "").trim(),
    template,
    sealShape || "round",
  ]
    .join("|")
    .toLowerCase();
}

export function hmacHash(canonical, secret = process.env.HMAC_SECRET) {
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
}

export function ensureKeyPair() {
  if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });
  if (fs.existsSync(PRIVATE_PATH) && fs.existsSync(PUBLIC_PATH)) {
    return {
      privateKey: fs.readFileSync(PRIVATE_PATH, "utf8"),
      publicKey: fs.readFileSync(PUBLIC_PATH, "utf8"),
    };
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  fs.writeFileSync(PRIVATE_PATH, privateKey);
  fs.writeFileSync(PUBLIC_PATH, publicKey);
  return { privateKey, publicKey };
}

export function signCanonical(canonical) {
  const { privateKey } = ensureKeyPair();
  return crypto.sign(null, Buffer.from(canonical), privateKey).toString("base64url");
}

export function verifySignature(canonical, signature) {
  try {
    const { publicKey } = ensureKeyPair();
    const sig = Buffer.from(String(signature || ""), "base64url");
    if (sig.length !== 64) return false;
    return crypto.verify(null, Buffer.from(canonical), publicKey, sig);
  } catch {
    return false;
  }
}

export function getPublicKey() {
  return ensureKeyPair().publicKey;
}

export function nextCertId() {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ALITS-${year}-${rand}`;
}
