import fs from "fs";
import { Router } from "express";
import { Certificate } from "../models/Certificate.js";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { canonicalPayload, hmacHash, nextCertId, signCanonical } from "../utils/crypto.js";
import { appendBlock } from "../services/blockchain.js";
import { publishHash } from "../services/ethereum.js";
import { generateCertificatePdf } from "../services/pdf.js";
import { notifyIssued } from "../services/notify.js";
import { buildQrPayload } from "../utils/qrPayload.js";

const router = Router();

function publicCert(doc) {
  return {
    certId: doc.certId,
    name: doc.name,
    email: doc.email,
    course: doc.course,
    issueDate: doc.issueDate,
    issuer: doc.issuer,
    template: doc.template,
    sealShape: doc.sealShape,
    grade: doc.grade,
    hash: doc.hash,
    signature: doc.signature,
    status: doc.status,
    revokeReason: doc.revokeReason,
    chainIndex: doc.chainIndex,
    chainHash: doc.chainHash,
    ethTxHash: doc.ethTxHash,
    ethNetwork: doc.ethNetwork,
    createdAt: doc.createdAt,
  };
}

router.get("/", protect, authorize("superadmin", "issuer"), async (req, res) => {
  const filter = {};
  if (req.user.role === "issuer") filter.issuerId = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) {
    filter.$or = [
      { name: new RegExp(req.query.q, "i") },
      { course: new RegExp(req.query.q, "i") },
      { certId: new RegExp(req.query.q, "i") },
      { email: new RegExp(req.query.q, "i") },
    ];
  }
  const items = await Certificate.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ certificates: items.map(publicCert) });
});

router.get("/mine", protect, authorize("student"), async (req, res) => {
  const items = await Certificate.find({ email: req.user.email }).sort({ createdAt: -1 });
  res.json({ certificates: items.map(publicCert) });
});

router.get("/:certId", protect, async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  const isOwner = cert.email === req.user.email;
  const isStaff = ["superadmin", "issuer"].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ message: "Forbidden" });
  res.json({ certificate: publicCert(cert) });
});

router.post("/", protect, authorize("superadmin", "issuer"), async (req, res) => {
  const { name, email, course, issueDate, issuer, template, grade, sealShape } = req.body;
  if (!name || !email || !course || !issueDate) {
    return res.status(400).json({ message: "Name, email, course and issue date are required" });
  }

  const certId = nextCertId();
  const payload = {
    certId,
    name,
    course,
    issueDate,
    issuer: issuer || req.user.organization || "ALITS Institute of Excellence",
    template: template || "academic",
    sealShape: sealShape === "square" ? "square" : "round",
  };
  const canonical = canonicalPayload(payload);
  const hash = hmacHash(canonical);
  const signature = signCanonical(canonical);
  const qrPayload = buildQrPayload({ ...payload, hash, signature });

  const cert = await Certificate.create({
    ...payload,
    email: email.toLowerCase(),
    issuerId: req.user._id,
    grade: grade || "",
    hash,
    signature,
    qrPayload,
    status: "active",
  });

  const block = await appendBlock(cert.certId, hash);
  cert.chainIndex = block.index;
  cert.chainHash = block.blockHash;

  const eth = await publishHash(cert.certId, hash);
  if (eth.published) {
    cert.ethTxHash = eth.txHash;
    cert.ethNetwork = eth.network;
  }

  const verifyUrl = `${process.env.FRONTEND_URL}/verify?id=${encodeURIComponent(cert.certId)}`;
  cert.pdfPath = await generateCertificatePdf(cert, verifyUrl);
  await cert.save();

  notifyIssued({
    studentEmail: cert.email,
    studentName: cert.name,
    certId: cert.certId,
    course: cert.course,
  }).catch(() => {});

  let studentPassword = null;
  const existingStudent = await User.findOne({ email: cert.email });
  if (!existingStudent) {
    studentPassword = `ALITS#${cert.certId.slice(-6)}`;
    await User.create({
      name: cert.name,
      email: cert.email,
      password: studentPassword,
      role: "student",
    });
  }

  res.status(201).json({ certificate: publicCert(cert), studentPassword });
});

router.patch("/:certId", protect, authorize("superadmin", "issuer"), async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  if (req.user.role === "issuer" && String(cert.issuerId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only edit your own certificates" });
  }
  if (cert.status === "revoked") {
    return res.status(400).json({ message: "Revoked certificates cannot be edited" });
  }

  const { name, course, issueDate, issuer, template, grade, email, sealShape } = req.body;
  if (name) cert.name = name;
  if (course) cert.course = course;
  if (issueDate) cert.issueDate = issueDate;
  if (issuer) cert.issuer = issuer;
  if (template) cert.template = template;
  if (sealShape === "round" || sealShape === "square") cert.sealShape = sealShape;
  if (grade !== undefined) cert.grade = grade;
  if (email) cert.email = email.toLowerCase();

  const canonical = canonicalPayload(cert);
  cert.hash = hmacHash(canonical);
  cert.signature = signCanonical(canonical);
  cert.qrPayload = buildQrPayload(cert);

  const block = await appendBlock(`${cert.certId}:update`, cert.hash);
  cert.chainIndex = block.index;
  cert.chainHash = block.blockHash;

  const verifyUrl = `${process.env.FRONTEND_URL}/verify?id=${encodeURIComponent(cert.certId)}`;
  cert.pdfPath = await generateCertificatePdf(cert, verifyUrl);
  await cert.save();
  res.json({ certificate: publicCert(cert) });
});

router.post("/:certId/revoke", protect, authorize("superadmin", "issuer"), async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  if (req.user.role === "issuer" && String(cert.issuerId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only revoke your own certificates" });
  }
  cert.status = "revoked";
  cert.revokedAt = new Date();
  cert.revokeReason = req.body.reason || "Revoked by issuer";
  await cert.save();
  res.json({ certificate: publicCert(cert) });
});

router.get("/:certId/pdf", protect, async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  const isOwner = cert.email === req.user.email;
  const isStaff = ["superadmin", "issuer"].includes(req.user.role);
  if (!isOwner && !isStaff) return res.status(403).json({ message: "Forbidden" });
  if (!cert.pdfPath || !fs.existsSync(cert.pdfPath)) {
    return res.status(404).json({ message: "PDF not generated yet" });
  }
  res.download(cert.pdfPath, `${cert.certId}.pdf`);
});

export default router;
