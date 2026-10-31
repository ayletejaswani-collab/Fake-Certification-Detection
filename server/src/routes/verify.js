import { Router } from "express";
import rateLimit from "express-rate-limit";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { VerificationLog } from "../models/VerificationLog.js";
import { canonicalPayload, hmacHash, verifySignature, getPublicKey } from "../utils/crypto.js";
import { notifyVerification } from "../services/notify.js";
import { parseQrPayloadParam } from "../utils/qrPayload.js";

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please wait a moment." },
});

router.use(limiter);

router.get("/public-key", (_req, res) => {
  res.type("text/plain").send(getPublicKey());
});

function evaluate(cert, providedHash) {
  const canonical = canonicalPayload(cert);
  const recomputed = hmacHash(canonical);
  const sigOk = verifySignature(canonical, cert.signature);
  const hashOk = recomputed === cert.hash;
  const qrHashOk = !providedHash || providedHash === cert.hash;

  if (cert.status === "revoked") {
    return { result: "revoked", hashOk, sigOk, qrHashOk, recomputed };
  }
  if (!hashOk || !sigOk || !qrHashOk) {
    return { result: "tampered", hashOk, sigOk, qrHashOk, recomputed };
  }
  return { result: "genuine", hashOk, sigOk, qrHashOk, recomputed };
}

router.post("/", async (req, res) => {
  const { certId, hash, source } = req.body || {};
  const id = String(certId || "").trim();
  if (!id) return res.status(400).json({ message: "Certificate ID is required" });

  const cert = await Certificate.findOne({ certId: id });
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  if (!cert) {
    await VerificationLog.create({
      certId: id,
      result: "not_found",
      source: source || "manual",
      ip,
      userAgent,
      details: "No matching record",
    });
    return res.json({
      result: "not_found",
      verdict: "Invalid / Fake",
      message: "This ID is not in the ALITS registry. Treat the document as forged.",
    });
  }

  const check = evaluate(cert, hash);
  await VerificationLog.create({
    certId: cert.certId,
    result: check.result,
    source: source || "web",
    ip,
    userAgent,
    details: `hashOk=${check.hashOk} sigOk=${check.sigOk} qrHashOk=${check.qrHashOk}`,
  });

  const issuer = cert.issuerId ? await User.findById(cert.issuerId) : null;
  notifyVerification({ issuer, certificate: cert, result: check.result }).catch(() => {});

  const labels = {
    genuine: { verdict: "Valid — Genuine", message: "Hash, signature, and registry record all match." },
    revoked: { verdict: "Invalid — Revoked", message: "This certificate was withdrawn by the issuer." },
    tampered: { verdict: "Invalid — Tampered", message: "Stored data no longer matches the cryptographic seal." },
  };

  res.json({
    result: check.result,
    ...labels[check.result],
    checks: {
      registry: true,
      hash: check.hashOk,
      signature: check.sigOk,
      qrHash: check.qrHashOk,
      blockchain: Boolean(cert.chainHash),
      ethereum: Boolean(cert.ethTxHash),
    },
    certificate: {
      certId: cert.certId,
      name: cert.name,
      course: cert.course,
      issueDate: cert.issueDate,
      issuer: cert.issuer,
      template: cert.template,
      sealShape: cert.sealShape,
      grade: cert.grade,
      status: cert.status,
      hash: cert.hash,
      chainIndex: cert.chainIndex,
      chainHash: cert.chainHash,
      ethTxHash: cert.ethTxHash,
    },
  });
});

function parseScanned(text) {
  const raw = String(text || "").trim();
  if (!raw) return { kind: "none" };
  // 1) our signed URL: ...verify?p=<base64url JSON>
  try {
    const url = new URL(raw);
    const p = url.searchParams.get("p");
    if (p) {
      const fields = parseQrPayloadParam(p);
      if (fields?.certId && fields.signature) return { kind: "signed", fields };
      return { kind: "garbled" };
    }
    const id = url.searchParams.get("id");
    const g = url.searchParams.get("g");
    if (id && g) return { kind: "id", certId: id, hash: "", compactSig: g };
    if (id) return { kind: "id", certId: id, hash: url.searchParams.get("h") || "" };
  } catch {
    /* not a URL */
  }
  // 2) raw JSON payload
  try {
    const o = JSON.parse(raw);
    if (o?.id && (o.g || o.sig)) {
      return {
        kind: "signed",
        fields: {
          certId: o.id,
          name: o.n ?? o.name,
          course: o.c ?? o.course,
          issueDate: o.d ?? o.issueDate,
          issuer: o.i ?? o.issuer,
          template: o.t ?? o.template,
          sealShape: o.s ?? o.sealShape ?? "round",
          hash: o.h ?? o.hash,
          signature: o.g ?? o.sig,
        },
      };
    }
    if (o?.id) return { kind: "id", certId: String(o.id), hash: o.hash || "" };
  } catch {
    /* not JSON */
  }
  // 3) bare ID
  if (/^[A-Za-z0-9-]{6,40}$/.test(raw)) return { kind: "id", certId: raw, hash: "" };
  return { kind: "garbled" };
}

const UPLOAD_LABELS = {
  genuine: {
    verdict: "Real — Genuine",
    message: "The seal signature, integrity hash and registry record all match. Revocation status: active.",
  },
  revoked: {
    verdict: "Revoked",
    message: "This certificate is authentic, but ALITS withdrew it. Do not accept it as valid.",
  },
  fake: {
    verdict: "Fake — Not Authentic",
    message: "This document failed verification.",
  },
};

router.post("/upload", async (req, res) => {
  const { qr, certId: typedId, seal, fileName } = req.body || {};
  const source = ["upload", "camera", "manual"].includes(req.body?.source) ? req.body.source : "upload";
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip;
  const userAgent = req.headers["user-agent"] || "";
  const sealInfo = {
    found: Boolean(seal?.found),
    shape: seal?.found && ["round", "square"].includes(seal.shape) ? seal.shape : null,
    confidence: Number(seal?.confidence || 0),
  };

  let scanned = parseScanned(qr);
  if (scanned.kind === "none" && typedId) scanned = { kind: "id", certId: String(typedId).trim(), hash: "" };

  const checks = {
    qr_found: scanned.kind === "signed" || scanned.kind === "id",
    signature: false,
    hash: false,
    registry: false,
    record_match: false,
    not_revoked: false,
    seal: null,
  };
  const reasons = [];

  const finish = async ({ result, cert, expectedSeal, extra = "" }) => {
    await VerificationLog.create({
      certId: cert?.certId || scanned.fields?.certId || scanned.certId || "",
      result,
      source,
      ip,
      userAgent,
      details: `file=${String(fileName || "").slice(0, 80)} ${Object.entries(checks)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")} seal=${sealInfo.shape || (sealInfo.found ? "unknown" : "none")} ${extra}`.trim(),
    });
    if (cert) {
      const issuer = cert.issuerId ? await User.findById(cert.issuerId) : null;
      notifyVerification({ issuer, certificate: cert, result }).catch(() => {});
    }
    const label = UPLOAD_LABELS[result];
    res.json({
      result,
      verdict: label.verdict,
      message: result === "fake" && reasons.length ? reasons[0] : label.message,
      reasons,
      checks,
      seal: { ...sealInfo, expected: expectedSeal || null },
      certificate: cert
        ? {
            certId: cert.certId,
            name: cert.name,
            course: cert.course,
            issueDate: cert.issueDate,
            issuer: cert.issuer,
            template: cert.template,
            sealShape: cert.sealShape,
            grade: cert.grade,
            status: cert.status,
            hash: cert.hash,
            chainIndex: cert.chainIndex,
            ethTxHash: cert.ethTxHash,
          }
        : null,
    });
  };

  // ── Nothing decodable ────────────────────────────────────────────────
  if (scanned.kind === "none" || scanned.kind === "garbled") {
    reasons.push(
      scanned.kind === "none"
        ? "No ALITS QR signature was found on this document. Genuine certificates always carry a signed QR."
        : "A QR code was found, but it is not an ALITS signed certificate code."
    );
    return finish({ result: "fake" });
  }

  // ── Signed QR payload ────────────────────────────────────────────────
  if (scanned.kind === "signed") {
    const f = scanned.fields;
    const canonical = canonicalPayload(f);
    checks.signature = verifySignature(canonical, f.signature);
    checks.hash = hmacHash(canonical) === f.hash;
    if (!checks.signature) {
      reasons.push("The digital signature in the QR was not issued by ALITS. The document was forged or edited.");
      return finish({ result: "fake" });
    }
    if (!checks.hash) {
      reasons.push("The integrity hash does not match the signed data. The document was altered.");
      return finish({ result: "fake" });
    }
    scanned = { kind: "id", certId: f.certId, hash: f.hash, signedFields: f };
  } else {
    // ID-only QR/typed ID: use the stored signature on the registry record below.
    checks.signature = null;
    checks.hash = null;
  }

  // ── Registry lookup ──────────────────────────────────────────────────
  const cert = await Certificate.findOne({ certId: scanned.certId });
  if (!cert) {
    reasons.push("This certificate ID is not in the ALITS registry. Treat the document as forged.");
    return finish({ result: "fake" });
  }
  checks.registry = true;

  const storedCanonical = canonicalPayload(cert);
  const storedSigOk = verifySignature(storedCanonical, cert.signature);
  const storedHashOk = hmacHash(storedCanonical) === cert.hash;
  if (checks.signature === null) {
    checks.signature = storedSigOk;
    checks.hash = storedHashOk;
  }
  if (scanned.compactSig !== undefined) {
    // Signature printed in the QR must be a valid ALITS signature over this record.
    const qrSigOk = scanned.compactSig === cert.signature && verifySignature(storedCanonical, scanned.compactSig);
    checks.signature = checks.signature && qrSigOk;
    if (!qrSigOk) {
      reasons.push("The signature in the QR is not a valid ALITS signature for this certificate. The document is forged.");
      return finish({ result: "fake", cert });
    }
  }
  if (!storedSigOk || !storedHashOk) {
    reasons.push("The registry record no longer matches its cryptographic seal (tampered).");
    return finish({ result: "fake", cert });
  }

  if (scanned.signedFields) {
    checks.record_match = canonicalPayload(scanned.signedFields) === storedCanonical && scanned.hash === cert.hash;
    if (!checks.record_match) {
      reasons.push("The signed QR does not match the current registry record for this ID.");
      return finish({ result: "fake", cert });
    }
  } else {
    checks.record_match = !scanned.hash || cert.hash.startsWith(scanned.hash) || scanned.hash === cert.hash;
    if (!checks.record_match) {
      reasons.push("The hash printed in the QR does not match the registry record.");
      return finish({ result: "fake", cert });
    }
  }

  // ── Seal (round / square) ────────────────────────────────────────────
  const expectedSeal = cert.sealShape || "round";
  if (sealInfo.found && sealInfo.shape) {
    checks.seal = sealInfo.shape === expectedSeal;
    if (!checks.seal) {
      reasons.push(
        `The seal on this document is ${sealInfo.shape}, but this certificate was issued with a ${expectedSeal} seal.`
      );
      return finish({ result: "fake", cert, expectedSeal });
    }
  }

  // ── Revocation ───────────────────────────────────────────────────────
  checks.not_revoked = cert.status !== "revoked";
  if (!checks.not_revoked) {
    reasons.push(cert.revokeReason ? `Reason: ${cert.revokeReason}` : "Withdrawn by the issuer.");
    return finish({ result: "revoked", cert, expectedSeal });
  }

  return finish({ result: "genuine", cert, expectedSeal });
});

export default router;
