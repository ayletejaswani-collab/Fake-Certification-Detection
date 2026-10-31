import "dotenv/config";
import { connectDb } from "./config/db.js";
import { User } from "./models/User.js";
import { Certificate } from "./models/Certificate.js";
import { VerificationLog } from "./models/VerificationLog.js";
import { Block } from "./models/Block.js";
import { Notification } from "./models/Notification.js";
import { canonicalPayload, hmacHash, signCanonical, ensureKeyPair } from "./utils/crypto.js";
import { appendBlock, ensureGenesis } from "./services/blockchain.js";
import { generateCertificatePdf } from "./services/pdf.js";
import { buildQrPayload } from "./utils/qrPayload.js";

async function upsertUser(data) {
  let user = await User.findOne({ email: data.email });
  if (user) return user;
  user = await User.create(data);
  return user;
}

function qrPayload(cert) {
  return buildQrPayload(cert);
}

async function issueSeedCert(data, issuerUser) {
  const existing = await Certificate.findOne({ certId: data.certId });
  if (existing) return existing;
  const canonical = canonicalPayload(data);
  const hash = hmacHash(canonical);
  const signature = signCanonical(canonical);
  const cert = await Certificate.create({
    ...data,
    issuerId: issuerUser._id,
    hash,
    signature,
    qrPayload: qrPayload({ ...data, hash, signature }),
    status: data.status || "active",
    revokeReason: data.revokeReason || "",
  });
  const block = await appendBlock(cert.certId, hash);
  cert.chainIndex = block.index;
  cert.chainHash = block.blockHash;
  const verifyUrl = `${process.env.FRONTEND_URL}/verify?id=${encodeURIComponent(cert.certId)}`;
  cert.pdfPath = await generateCertificatePdf(cert, verifyUrl);
  await cert.save();
  return cert;
}

async function seed() {
  await connectDb(process.env.MONGODB_URI);
  ensureKeyPair();
  await Block.deleteMany({});
  await Certificate.deleteMany({});
  await VerificationLog.deleteMany({});
  await Notification.deleteMany({});
  await ensureGenesis();

  const admin = await upsertUser({
    name: "ALITS Registrar",
    email: process.env.SEED_ADMIN_EMAIL || "admin@alits.edu",
    password: process.env.SEED_ADMIN_PASSWORD || "ALITS@2026",
    role: "superadmin",
    organization: "ALITS Institute of Excellence",
    phone: "+15550001000",
    notifyEmail: true,
    notifySms: true,
  });

  const issuer = await upsertUser({
    name: "Dr. Meera Iyer",
    email: "issuer@alits.edu",
    password: "Issuer@2026",
    role: "issuer",
    organization: "ALITS Institute of Excellence",
    phone: "+15550002000",
    notifyEmail: true,
  });

  const student = await upsertUser({
    name: "Arjun Sharma",
    email: "student@alits.edu",
    password: "Student@2026",
    role: "student",
  });

  const real = await issueSeedCert(
    {
      certId: "ALITS-2026-REAL01",
      name: student.name,
      email: student.email,
      course: "B.Tech Computer Science — Final Year Distinction",
      issueDate: "15 March 2026",
      issuer: "ALITS Institute of Excellence",
      template: "academic",
      grade: "A+",
    },
    issuer
  );

  await issueSeedCert(
    {
      certId: "ALITS-2026-WORK01",
      name: "Priya Nair",
      email: "priya.nair@alits.edu",
      course: "Applied Generative AI Workshop",
      issueDate: "02 April 2026",
      issuer: "ALITS Institute of Excellence",
      template: "workshop",
      sealShape: "square",
    },
    issuer
  );

  await issueSeedCert(
    {
      certId: "ALITS-2026-INTN01",
      name: "Kabir Malhotra",
      email: "kabir.m@alits.edu",
      course: "Software Engineering Internship — 12 weeks",
      issueDate: "30 June 2026",
      issuer: "ALITS Institute of Excellence",
      template: "internship",
      grade: "Outstanding",
    },
    issuer
  );

  await issueSeedCert(
    {
      certId: "ALITS-2026-REVOK1",
      name: "Demo Revoked Holder",
      email: "revoked@alits.edu",
      course: "Cybersecurity Foundations",
      issueDate: "10 January 2026",
      issuer: "ALITS Institute of Excellence",
      template: "academic",
      status: "revoked",
      revokeReason: "Issued in error — replaced by a corrected certificate",
    },
    admin
  );

  await VerificationLog.insertMany([
    { certId: real.certId, result: "genuine", source: "camera", details: "Seed: recruiter scan" },
    { certId: real.certId, result: "genuine", source: "web", details: "Seed: university check" },
    { certId: "FAKE-999-XXXX", result: "not_found", source: "manual", details: "Seed: forged ID" },
    { certId: "ALITS-2026-REVOK1", result: "revoked", source: "web", details: "Seed: revoked check" },
    { certId: "ALITS-2026-TAMPER", result: "tampered", source: "demo", details: "Seed: hash mismatch demo" },
  ]);

  console.log("Seed complete.");
  console.log("Superadmin  admin@alits.edu / ALITS@2026");
  console.log("Issuer      issuer@alits.edu / Issuer@2026");
  console.log("Student     student@alits.edu / Student@2026");
  console.log("Genuine ID  ALITS-2026-REAL01");
  console.log("Revoked ID  ALITS-2026-REVOK1");
  console.log("Fake ID     FAKE-999-XXXX");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
