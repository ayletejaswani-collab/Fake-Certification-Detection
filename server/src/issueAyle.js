/**
 * Issues three genuine ALITS certificates for "Ayle Tejaswini" (real registry
 * records, Ed25519-signed, signed QR, red seal) and writes the PDFs to
 *   server/samples/ayle-tejaswini/
 * Upload them at /verify to see "Real — Genuine".
 *
 *   npm run issue:ayle --prefix server      (after `npm run seed`)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDb } from "./config/db.js";
import { Certificate } from "./models/Certificate.js";
import { User } from "./models/User.js";
import { canonicalPayload, hmacHash, signCanonical, ensureKeyPair } from "./utils/crypto.js";
import { buildQrPayload } from "./utils/qrPayload.js";
import { appendBlock, ensureGenesis } from "./services/blockchain.js";
import { generateStyledPdf } from "./services/styledPdf.js";
import { UPLOAD_DIR } from "./services/pdf.js";

const NAME = "Ayle Tejaswini";
const EMAIL = "ayle.tejaswini@alits.edu";
const COLLEGE = "Anantha Lakshmi Institute of Technology and Sciences";
const ISSUER = "ALITS Institute of Excellence";
const ROLL = "232G1A0469";
const OUT_DIR = path.resolve("samples", "ayle-tejaswini");

const SPECS = [
  {
    certId: "ALITS-2026-AYLE01",
    layout: "landscape",
    template: "internship",
    sealShape: "round",
    course: "Cyber Security Online Internship Program (20/04/2026 - 19/06/2026)",
    issueDate: "19 June 2026",
    file: "1_internship_cyber_security_round_seal.pdf",
    details: {
      body: `For Successfully Completing Cyber Security Online Internship Program at ALITS From 20/04/2026 to 19/06/2026, Roll No: ${ROLL}, College: ${COLLEGE}.`,
      signer: { name: "Dr. Meera Iyer", title: "Director of Programs" },
    },
  },
  {
    certId: "ALITS-2026-AYLE02",
    layout: "portrait",
    template: "internship",
    sealShape: "square",
    course: "Quantum Computing Virtual Internship - 8 weeks (April - June 2026)",
    issueDate: "30 June 2026",
    file: "2_virtual_internship_quantum_computing_square_seal.pdf",
    details: {
      institute: COLLEGE,
      rollNo: ROLL,
      duration: "has successfully completed the 8-weeks",
      program: "Quantum Computing Virtual Internship",
      period: "During April - June 2026",
      studentId: `STU${ROLL}`,
      grade: "A+",
      signerLeft: { name: "Dr. Meera Iyer", title: "Director of Programs, ALITS" },
      signerRight: { name: "Registrar", title: "Office of the Registrar, ALITS" },
    },
  },
  {
    certId: "ALITS-2026-AYLE03",
    layout: "landscape",
    template: "workshop",
    sealShape: "square",
    course: "Full Stack Web Development Workshop (10/08/2026 - 14/08/2026)",
    issueDate: "28 August 2026",
    file: "3_workshop_full_stack_web_square_seal.pdf",
    theme: {
      accent: "#2bb3a3",
      navy: "#0b2a5b",
      title: "CERTIFICATE OF COMPLETION",
      intro: "This workshop certificate is proudly presented to",
    },
    details: {
      body: `For Successfully Completing the Full Stack Web Development Workshop (40 hours) conducted by ALITS from 10/08/2026 to 14/08/2026, Roll No: ${ROLL}, College: ${COLLEGE}.`,
      signer: { name: "Dr. Meera Iyer", title: "Director of Programs" },
    },
  },
];

async function run() {
  await connectDb(process.env.MONGODB_URI);
  ensureKeyPair();
  await ensureGenesis();

  const issuerUser =
    (await User.findOne({ email: "issuer@alits.edu" })) || (await User.findOne({ role: "superadmin" }));
  if (!issuerUser) throw new Error("No issuer user found - run `npm run seed` first.");

  if (!(await User.findOne({ email: EMAIL }))) {
    await User.create({ name: NAME, email: EMAIL, password: "Student@2026", role: "student" });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  for (const spec of SPECS) {
    await Certificate.deleteOne({ certId: spec.certId });

    const data = {
      certId: spec.certId,
      name: NAME,
      course: spec.course,
      issueDate: spec.issueDate,
      issuer: ISSUER,
      template: spec.template,
      sealShape: spec.sealShape,
    };
    const canonical = canonicalPayload(data);
    const hash = hmacHash(canonical);
    const signature = signCanonical(canonical);
    const qrPayload = buildQrPayload({ ...data, hash, signature });

    const cert = await Certificate.create({
      ...data,
      email: EMAIL,
      issuerId: issuerUser._id,
      hash,
      signature,
      qrPayload,
      status: "active",
    });
    const block = await appendBlock(cert.certId, hash);
    cert.chainIndex = block.index;
    cert.chainHash = block.blockHash;

    const year = String(spec.issueDate).match(/\d{4}/)?.[0] || "2026";
    const pdfPath = path.join(UPLOAD_DIR, `${cert.certId}.pdf`);
    await generateStyledPdf({
      cert: cert.toObject(),
      layout: spec.layout,
      theme: spec.theme,
      details: { ...spec.details, year },
      outPath: pdfPath,
    });
    cert.pdfPath = pdfPath;
    await cert.save();

    fs.copyFileSync(pdfPath, path.join(OUT_DIR, spec.file));
    console.log(`Issued ${cert.certId}  ->  samples/ayle-tejaswini/${spec.file}`);
  }

  console.log("\nDone. Upload these PDFs at http://localhost:5173/verify");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
