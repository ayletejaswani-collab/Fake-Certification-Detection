import pptxgen from "pptxgenjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "ALITS CertiChain";
pptx.title = "Secure Digital Certificate Issuance and Verification";

const NAVY = "0B1C33";
const LIME = "6B8F14";
const INK = "1A1A1A";
const MUTED = "5C6570";
const CARD = "F4F1EA";
const WHITE = "FFFFFF";
const LINE = "E4E0D8";

function base(slide, num, total = 12) {
  slide.background = { color: WHITE };
  slide.addShape("rect", { x: 0, y: 0, w: 13.33, h: 0.92, fill: { color: NAVY } });
  slide.addText("ALITS CERTICHAIN", {
    x: 0.45,
    y: 0.18,
    w: 8,
    h: 0.28,
    fontSize: 11,
    bold: true,
    color: "C6E04A",
    fontFace: "Calibri",
    margin: 0,
  });
  slide.addText("Secure Digital Certificate Issuance & Verification", {
    x: 0.45,
    y: 0.46,
    w: 10,
    h: 0.32,
    fontSize: 12,
    color: WHITE,
    fontFace: "Calibri",
    margin: 0,
  });
  slide.addShape("rect", { x: 0, y: 7.22, w: 13.33, h: 0.28, fill: { color: NAVY } });
  slide.addText("MERN  |  QR verification  |  HMAC + RSA  |  Ethereum Sepolia", {
    x: 0.45,
    y: 7.24,
    w: 10,
    h: 0.22,
    fontSize: 10,
    color: WHITE,
    fontFace: "Calibri",
    margin: 0,
  });
  slide.addText(`${num} / ${total}`, {
    x: 11.6,
    y: 7.24,
    w: 1.3,
    h: 0.22,
    fontSize: 10,
    color: "C6E04A",
    align: "right",
    fontFace: "Calibri",
    margin: 0,
  });
}

function heading(slide, title) {
  slide.addText(title, {
    x: 0.45,
    y: 1.12,
    w: 12.4,
    h: 0.48,
    fontSize: 26,
    bold: true,
    color: NAVY,
    fontFace: "Calibri",
    margin: 0,
  });
}

function card(slide, x, y, w, h, title, body) {
  slide.addShape("rect", { x, y, w, h, fill: { color: CARD }, line: { color: LINE, width: 1 } });
  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.14,
    w: w - 0.36,
    h: 0.36,
    fontSize: 14,
    bold: true,
    color: NAVY,
    fontFace: "Calibri",
    margin: 0,
  });
  slide.addText(body, {
    x: x + 0.18,
    y: y + 0.52,
    w: w - 0.36,
    h: h - 0.68,
    fontSize: 13,
    color: MUTED,
    fontFace: "Calibri",
    margin: 0,
    valign: "top",
  });
}

// 1 Title
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addShape("rect", { x: 0, y: 0, w: 0.22, h: 7.5, fill: { color: "C6E04A" } });
  s.addText("FINAL YEAR / MINI PROJECT PRESENTATION", {
    x: 0.7,
    y: 1.55,
    w: 12,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: "C6E04A",
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("ALITS CertiChain", {
    x: 0.7,
    y: 2.05,
    w: 12,
    h: 0.7,
    fontSize: 40,
    bold: true,
    color: WHITE,
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("A MERN system to issue official certificates and instantly detect fake, tampered, or revoked documents using QR codes, cryptographic seals, and Ethereum Sepolia.", {
    x: 0.7,
    y: 2.9,
    w: 11.2,
    h: 1.1,
    fontSize: 18,
    color: "D7DDE5",
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("Tech  ·  MongoDB  ·  Express  ·  React  ·  Node.js  ·  Sepolia", {
    x: 0.7,
    y: 5.55,
    w: 12,
    h: 0.35,
    fontSize: 15,
    color: "C6E04A",
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("ALITS Institute of Excellence  ·  Academic year 2025–26", {
    x: 0.7,
    y: 6.05,
    w: 12,
    h: 0.3,
    fontSize: 14,
    color: "9AA6B2",
    fontFace: "Calibri",
    margin: 0,
  });
}

// 2 Agenda
{
  const s = pptx.addSlide();
  base(s, 2);
  heading(s, "Agenda");
  const items = [
    ["01", "Problem", "Why paper and PDF certificates fail"],
    ["02", "Solution", "QR registry with cryptographic seals"],
    ["03", "Architecture", "Users, modules, and data flow"],
    ["04", "Security", "Hash, signature, revoke, on-chain stamp"],
    ["05", "Implementation", "MERN stack and Sepolia"],
    ["06", "Demonstration", "Fake vs real + live issue/verify"],
  ];
  items.forEach((row, i) => {
    const col = i % 2;
    const rown = Math.floor(i / 2);
    const x = 0.45 + col * 6.35;
    const y = 1.8 + rown * 1.55;
    s.addShape("rect", { x, y, w: 6.1, h: 1.38, fill: { color: CARD } });
    s.addText(row[0], { x: x + 0.2, y: y + 0.22, w: 1.1, h: 0.9, fontSize: 22, bold: true, color: LIME, fontFace: "Calibri", margin: 0, valign: "middle" });
    s.addText(row[1], { x: x + 1.35, y: y + 0.28, w: 4.5, h: 0.4, fontSize: 18, bold: true, color: NAVY, fontFace: "Calibri", margin: 0 });
    s.addText(row[2], { x: x + 1.35, y: y + 0.72, w: 4.5, h: 0.4, fontSize: 14, color: MUTED, fontFace: "Calibri", margin: 0 });
  });
}

// 3 Problem
{
  const s = pptx.addSlide();
  base(s, 3);
  heading(s, "Problem: certificates are easy to forge");
  card(s, 0.45, 1.78, 4.0, 4.9, "Today", "A student can photocopy a certificate or edit a PDF in a design tool. The name, course, and date look official. A recruiter has no fast way to check the issuing office.");
  card(s, 4.65, 1.78, 4.0, 4.9, "Impact", "Fake degree and course certificates enter placements. Institutes cannot revoke a document once it is printed. Trust depends only on how the paper looks.");
  card(s, 8.85, 1.78, 4.0, 4.9, "Need", "A public verification page. A unique QR. A cryptographic seal. A revocation list. Proof that can also be seen on a public blockchain explorer.");
}

// 4 Solution
{
  const s = pptx.addSlide();
  base(s, 4);
  heading(s, "Solution: a live sealed registry");
  const sols = [
    ["Unique ID + QR", "Every genuine PDF carries ALITS-YYYY-XXXXXX and a scannable verify link."],
    ["HMAC + RSA seal", "If one letter of the name or course changes, the hash no longer matches."],
    ["Public verify page", "Upload PDF, scan QR, or type the ID. No login required."],
    ["Clear verdict", "Genuine · Fake · Tampered · Revoked — shown with official fields."],
  ];
  sols.forEach((row, i) => {
    const y = 1.78 + i * 1.2;
    s.addShape("rect", { x: 0.45, y, w: 12.4, h: 1.08, fill: { color: CARD } });
    s.addShape("rect", { x: 0.45, y, w: 0.14, h: 1.08, fill: { color: "C6E04A" } });
    s.addText(row[0], { x: 0.85, y: y + 0.14, w: 11.7, h: 0.36, fontSize: 16, bold: true, color: NAVY, fontFace: "Calibri", margin: 0 });
    s.addText(row[1], { x: 0.85, y: y + 0.52, w: 11.7, h: 0.4, fontSize: 14, color: MUTED, fontFace: "Calibri", margin: 0 });
  });
}

// 5 Architecture
{
  const s = pptx.addSlide();
  base(s, 5);
  heading(s, "System architecture");
  const boxes = [
    [0.45, "React web app", "Landing, verify, demo,\nissuer dashboard, student portal"],
    [3.65, "Express API", "JWT auth, issue, revoke,\nverify, analytics, Ethereum"],
    [6.85, "MongoDB", "Users, certificates,\nblocks, verify logs"],
    [10.05, "Seals", "HMAC, RSA keys,\nlocal chain, Sepolia"],
  ];
  boxes.forEach(([x, t, b]) => {
    s.addShape("rect", { x, y: 1.85, w: 2.95, h: 2.55, fill: { color: NAVY } });
    s.addText(t, { x: x + 0.15, y: 2.05, w: 2.65, h: 0.55, fontSize: 16, bold: true, color: "C6E04A", fontFace: "Calibri", margin: 0 });
    s.addText(b, { x: x + 0.15, y: 2.7, w: 2.65, h: 1.4, fontSize: 13, color: WHITE, fontFace: "Calibri", margin: 0 });
  });
  s.addText("Roles: Superadmin  ·  Issuer  ·  Student  ·  Public verifier (no login)", {
    x: 0.45,
    y: 4.65,
    w: 12.4,
    h: 0.4,
    fontSize: 15,
    color: NAVY,
    bold: true,
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("Data stored per certificate: cert ID, name, course, issue date, issuer, HMAC, RSA signature, status (active/revoked), QR payload, PDF path, local block, Ethereum transaction hash.", {
    x: 0.45,
    y: 5.15,
    w: 12.4,
    h: 1.5,
    fontSize: 14,
    color: MUTED,
    fontFace: "Calibri",
    margin: 0,
  });
}

// 6 Modules
{
  const s = pptx.addSlide();
  base(s, 6);
  heading(s, "Modules built");
  const mods = [
    ["01  Generator", "Academic, workshop, internship PDFs with QR"],
    ["02  Verification", "Upload PDF/photo, camera scan, or type ID"],
    ["03  Admin panel", "Issue, search, revoke, analytics, people"],
    ["04  Student portal", "Download certificates issued to that email"],
    ["05  Local ledger", "Proof-of-work blocks linked by previous hash"],
    ["06  Sepolia stamp", "Real testnet transaction visible on Etherscan"],
  ];
  mods.forEach((m, i) => {
    const x = 0.45 + (i % 3) * 4.2;
    const y = 1.8 + Math.floor(i / 3) * 2.4;
    card(s, x, y, 4.0, 2.2, m[0], m[1]);
  });
}

// 7 Workflow
{
  const s = pptx.addSlide();
  base(s, 7);
  heading(s, "Workflow");
  const steps = [
    ["1", "Issuer\nfills form"],
    ["2", "Seal + QR\n+ PDF"],
    ["3", "Store DB\n+ block"],
    ["4", "Stamp on\nSepolia"],
    ["5", "Anyone\nverifies"],
  ];
  steps.forEach((st, i) => {
    const x = 0.45 + i * 2.55;
    s.addShape("rect", { x, y: 1.9, w: 2.35, h: 2.2, fill: { color: NAVY } });
    s.addText(st[0], { x, y: 2.05, w: 2.35, h: 0.55, align: "center", fontSize: 22, bold: true, color: "C6E04A", fontFace: "Calibri", margin: 0 });
    s.addText(st[1], { x: x + 0.1, y: 2.65, w: 2.15, h: 1.2, align: "center", fontSize: 14, color: WHITE, fontFace: "Calibri", margin: 0 });
    if (i < 4) {
      s.addText("→", { x: x + 2.2, y: 2.6, w: 0.4, h: 0.5, fontSize: 20, color: LIME, fontFace: "Calibri", margin: 0 });
    }
  });
  s.addText("Verification result", {
    x: 0.45,
    y: 4.4,
    w: 12.4,
    h: 0.35,
    fontSize: 16,
    bold: true,
    color: NAVY,
    fontFace: "Calibri",
    margin: 0,
  });
  s.addTable(
    [
      [
        { text: "Input", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "System check", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "Verdict", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
      ],
      ["ID exists, hash matches, active", "Registry + HMAC + RSA", "Valid — Genuine"],
      ["ID never issued", "No MongoDB record", "Invalid / Fake"],
      ["Fields altered after issue", "Recomputed hash differs", "Tampered"],
      ["Issuer withdrew it", "status = revoked", "Invalid — Revoked"],
    ],
    {
      x: 0.45,
      y: 4.85,
      w: 12.4,
      colW: [5.0, 4.2, 3.2],
      border: [{ pt: 0.5, color: LINE }],
      fontFace: "Calibri",
      fontSize: 12,
      color: INK,
      valign: "middle",
      align: "left",
    }
  );
}

// 8 Security
{
  const s = pptx.addSlide();
  base(s, 8);
  heading(s, "Security features");
  const secs = [
    ["Tamper detection", "HMAC-SHA256 of canonical fields. Any edit changes the digest."],
    ["Digital signature", "RSA-SHA256 with institute private key. Public key can verify offline."],
    ["Revocation list", "Certificate is marked revoked. History is never deleted."],
    ["JWT authentication", "Only registrar and issuers can generate or revoke."],
    ["Rate limiting", "Verify API is capped to reduce automated scraping."],
    ["Ethereum stamp", "Hash published on Sepolia. Independent proof on Etherscan."],
  ];
  secs.forEach((row, i) => {
    const x = 0.45 + (i % 3) * 4.2;
    const y = 1.8 + Math.floor(i / 3) * 2.4;
    card(s, x, y, 4.0, 2.2, row[0], row[1]);
  });
}

// 9 Tech stack
{
  const s = pptx.addSlide();
  base(s, 9);
  heading(s, "Technology stack");
  s.addTable(
    [
      [
        { text: "Layer", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "Choice", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "Why", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
      ],
      ["Frontend", "React (Vite) + Tailwind", "Fast UI, public verify + dashboards"],
      ["Backend", "Node.js + Express", "REST APIs, JWT, PDF generation"],
      ["Database", "MongoDB + Mongoose", "Certificates, users, logs, blocks"],
      ["Document", "PDFKit + qrcode", "Official printable certificate"],
      ["QR read", "pdfjs-dist + jsQR", "Upload PDF/photo and extract QR"],
      ["Crypto", "Node crypto", "HMAC-SHA256 and RSA-SHA256"],
      ["Blockchain", "Local PoW + ethers.js", "Internal chain + Sepolia stamp"],
      ["Auth", "JWT + bcrypt", "superadmin, issuer, student"],
    ],
    {
      x: 0.45,
      y: 1.75,
      w: 12.4,
      colW: [2.4, 4.4, 5.6],
      border: [{ pt: 0.5, color: LINE }],
      fontFace: "Calibri",
      fontSize: 13,
      color: INK,
      valign: "middle",
    }
  );
}

// 10 Ethereum
{
  const s = pptx.addSlide();
  base(s, 10);
  heading(s, "Ethereum Sepolia stamp");
  card(s, 0.45, 1.8, 6.1, 4.85, "What is stamped", "When a certificate is issued (or stamped later from Ledger), the HMAC is sent in a real Sepolia transaction.\n\nIf HashRegistry.sol is deployed, stamp(certHash, certId) is called.\n\nIf not, a zero-value transaction still carries ALITS|ID|hash in calldata.\n\nEither way the tx hash is stored and opened on sepolia.etherscan.io.");
  card(s, 6.75, 1.8, 6.1, 4.85, "How we demo it", "1. Admin opens Ledger.\n2. Fund the shown wallet from a Sepolia faucet (free test ETH).\n3. Click Stamp on Sepolia.\n4. Open the transaction on Etherscan.\n\nThis proves the hash exists outside our own database.");
}

// 11 Demo
{
  const s = pptx.addSlide();
  base(s, 11);
  heading(s, "Live demonstration (2 minutes)");
  s.addTable(
    [
      [
        { text: "Step", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "Action", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
        { text: "What to say", options: { fill: { color: NAVY }, color: WHITE, bold: true } },
      ],
      ["1", "Open Fake vs real", "Same-looking paper, three official results"],
      ["2", "IDs: REAL01 / FAKE-999 / REVOK1", "Genuine, Fake, Revoked"],
      ["3", "Login admin@alits.edu", "Password ALITS@2026"],
      ["4", "Issue certificate → download PDF", "QR is now a short verify URL"],
      ["5", "Verify → upload that PDF", "Valid — Genuine"],
      ["6", "Ledger → Stamp on Sepolia", "Show Etherscan if test ETH is funded"],
    ],
    {
      x: 0.45,
      y: 1.75,
      w: 12.4,
      colW: [1.2, 5.2, 6.0],
      border: [{ pt: 0.5, color: LINE }],
      fontFace: "Calibri",
      fontSize: 14,
      color: INK,
      valign: "middle",
    }
  );
}

// 12 Close
{
  const s = pptx.addSlide();
  s.background = { color: NAVY };
  s.addShape("rect", { x: 0, y: 0, w: 0.22, h: 7.5, fill: { color: "C6E04A" } });
  s.addText("CONCLUSION", {
    x: 0.7,
    y: 1.7,
    w: 12,
    h: 0.35,
    fontSize: 13,
    bold: true,
    color: "C6E04A",
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("A copy can look perfect.\nThe registry still says fake.", {
    x: 0.7,
    y: 2.2,
    w: 12,
    h: 1.6,
    fontSize: 32,
    bold: true,
    color: WHITE,
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("Thank you. Questions are welcome.", {
    x: 0.7,
    y: 4.3,
    w: 12,
    h: 0.4,
    fontSize: 18,
    color: "C6E04A",
    fontFace: "Calibri",
    margin: 0,
  });
  s.addText("Report: docs/PROJECT_REPORT.md", {
    x: 0.7,
    y: 5.9,
    w: 12,
    h: 0.3,
    fontSize: 14,
    color: "9AA6B2",
    fontFace: "Calibri",
    margin: 0,
  });
}

const out = path.join(__dirname, "ALITS-CertiChain.pptx");
await pptx.writeFile({ fileName: out });
console.log("Wrote", out);
