/**
 * ALITS certificate designs (pure drawing code, takes a pdfkit-compatible `doc`).
 *   drawLandscape – yellow/navy "internship" layout
 *   drawPortrait  – navy/orange "virtual internship" layout with medal
 * All branding is ALITS only. The red ALITS seal (round or square) and the
 * signed QR are drawn in both so the upload verifier can read them.
 */
import { drawSeal } from "./seal.js";

const NAVY = "#0b2a5b";
const BLUE = "#1a237e";
const ORANGE = "#f7a21b"; // hue > 30°, never mistaken for the red seal
const GREY = "#d9d9d9";
const LIME = "#baff39";

function center(doc, str, y, { size = 12, font = "Helvetica", color = "#111", x = 0, width, spacing = 0 }) {
  doc.font(font).fontSize(size).fillColor(color);
  doc.text(str, x, y, { width, align: "center", lineBreak: false, characterSpacing: spacing });
}

function logo(doc, x, y, dark = "#111") {
  doc.rect(x, y, 34, 34).fill(LIME);
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#111").text("A", x, y + 7, { width: 34, align: "center", lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(20).fillColor(dark).text("ALITS", x + 44, y + 1, { lineBreak: false, characterSpacing: 1.5 });
  doc.font("Helvetica-Bold").fontSize(6.5).fillColor("#666").text("INSTITUTE OF TECHNOLOGY & SCIENCES", x + 44, y + 25, { lineBreak: false, characterSpacing: 0.8 });
}

/** Hand-drawn style signature scribble. */
function signature(doc, x, y, variant, color = NAVY) {
  doc.save();
  doc.translate(x, y);
  doc.lineWidth(1.6).strokeColor(color).lineCap("round").lineJoin("round");
  if (variant === 1) {
    doc.moveTo(0, 26).bezierCurveTo(6, -6, 14, 44, 22, 12).bezierCurveTo(28, -10, 34, 34, 46, 14)
      .bezierCurveTo(54, 2, 62, 30, 78, 10).bezierCurveTo(90, -4, 100, 22, 124, 14).stroke();
    doc.lineWidth(1.1).moveTo(8, 38).bezierCurveTo(40, 30, 80, 44, 128, 32).stroke();
  } else {
    doc.moveTo(0, 20).bezierCurveTo(12, -12, 20, 40, 30, 8).bezierCurveTo(36, -14, 52, 36, 60, 10)
      .bezierCurveTo(72, 28, 86, -8, 96, 16).bezierCurveTo(104, 30, 116, 4, 130, 18).stroke();
    doc.lineWidth(1.1).moveTo(20, 36).bezierCurveTo(60, 26, 100, 40, 126, 28).stroke();
  }
  doc.restore();
}

function medal(doc, cx, cy, r, label, ink = NAVY, gold = "#e8b008") {
  // ribbon tails
  doc.polygon([cx - r * 0.55, cy + r * 0.6], [cx - r * 0.1, cy + r * 1.7], [cx - r * 0.35, cy + r * 1.45], [cx - r * 0.75, cy + r * 1.7], [cx - r * 0.95, cy + r * 0.7]).fill(ink);
  doc.polygon([cx + r * 0.55, cy + r * 0.6], [cx + r * 0.1, cy + r * 1.7], [cx + r * 0.35, cy + r * 1.45], [cx + r * 0.75, cy + r * 1.7], [cx + r * 0.95, cy + r * 0.7]).fill(ink);
  // scalloped edge
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    doc.circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.1).fill(gold);
  }
  doc.circle(cx, cy, r).fill(gold);
  doc.circle(cx, cy, r * 0.82).fill(ink);
  doc.circle(cx, cy, r * 0.72).lineWidth(1).stroke("#ffffff");
  doc.font("Times-Bold").fontSize(r * 0.5).fillColor("#ffffff").text(label, cx - r, cy - r * 0.25, { width: r * 2, align: "center", lineBreak: false });
}

/* ───────────────────────── LANDSCAPE ───────────────────────── */
export function drawLandscape(doc, cert, d, qrBuf, theme = {}) {
  const w = doc.page.width;
  const h = doc.page.height;
  const accent = theme.accent || "#f9b928";
  const navy = theme.navy || NAVY;

  doc.rect(0, 0, w, h).fill("#ffffff");
  // top-right corner
  doc.polygon([w - 230, 0], [w, 0], [w, 190]).fill(accent);
  doc.polygon([w - 150, 0], [w, 0], [w, 120]).fill(navy);
  doc.polygon([w - 74, 0], [w, 0], [w, 48]).fill(accent);
  // bottom-left corner
  doc.polygon([0, h], [0, h - 105], [145, h]).fill(accent);
  doc.polygon([0, h], [0, h - 55], [75, h]).fill(navy);
  // faint watermark chevron
  doc.save();
  doc.fillOpacity(0.1);
  doc.polygon([w / 2 - 140, 330], [w / 2 + 40, 240], [w / 2 + 180, 330], [w / 2 + 40, 470]).fill(accent);
  doc.restore();

  medal(doc, w - 62, 66, 30, "2026", navy, "#e8b008");

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#111").text(`Certificate Id: ${cert.certId}`, 40, 26, { lineBreak: false });
  logo(doc, 40, 56);

  center(doc, theme.title || "CERTIFICATE OF INTERNSHIP", 128, { size: 34, font: "Helvetica-Bold", width: w });
  center(doc, theme.intro || "This Internship certificate is proudly awarded to", 178, { size: 14, font: "Helvetica", color: "#222", width: w });
  center(doc, String(cert.name).toUpperCase(), 218, { size: 30, font: "Times-Bold", color: navy, width: w });
  doc.moveTo(w / 2 - 250, 262).lineTo(w / 2 + 250, 262).lineWidth(1).strokeColor(accent).stroke();
  doc.font("Times-Roman").fontSize(13.5).fillColor("#222").text(d.body, 110, 280, { width: w - 220, align: "center", lineGap: 5 });

  // signature (left)
  signature(doc, 86, 428, 1);
  doc.moveTo(72, 478).lineTo(232, 478).lineWidth(0.8).strokeColor("#333").stroke();
  doc.font("Helvetica-BoldOblique").fontSize(11).fillColor("#111").text(d.signer.title, 72, 484, { lineBreak: false });
  doc.font("Times-Italic").fontSize(9.5).fillColor("#444").text(d.signer.name, 72, 500, { lineBreak: false });

  // seal (center) — red ALITS seal, round or square
  drawSeal(doc, w / 2, 452, 50, cert.sealShape || "round", d.year);

  // QR (right)
  const qr = 112;
  const qx = w - 60 - qr;
  const qy = 396;
  if (qrBuf) {
    doc.rect(qx - 6, qy - 6, qr + 12, qr + 12).fill("#ffffff");
    doc.image(qrBuf, qx, qy, { width: qr, height: qr });
  }
  doc.font("Helvetica-BoldOblique").fontSize(11).fillColor("#111").text("Verification at", qx - 6, qy + qr + 10, { width: qr + 12, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(7.5).fillColor("#444").text("Scan or upload at /verify", qx - 6, qy + qr + 25, { width: qr + 12, align: "center", lineBreak: false });

  center(doc, "WWW.ALITS.EDU", h - 40, { size: 11, font: "Helvetica-Bold", color: "#111", width: w, spacing: 2.5 });
  doc.font("Helvetica").fontSize(6.5).fillColor("#666").text(
    `Digitally signed by ALITS Registrar (Ed25519) · Integrity ${String(cert.hash || "").slice(0, 20)}…`,
    40, h - 20, { width: w - 80, align: "center", lineBreak: false }
  );
}

/* ───────────────────────── PORTRAIT ───────────────────────── */
function swoosh(doc, w, side, y, thick, color, cy) {
  // band running from page edge toward the centre medal
  const x0 = side === "L" ? 20 : w - 20;
  const x1 = side === "L" ? w / 2 - 36 : w / 2 + 36;
  doc.polygon([x0, y], [x1, cy - thick / 2], [x1, cy + thick / 2], [x0, y + thick]).fill(color);
}

export function drawPortrait(doc, cert, d, qrBuf, theme = {}) {
  const w = doc.page.width;
  const h = doc.page.height;
  const navy = theme.navy || NAVY;

  doc.rect(0, 0, w, h).fill(navy);
  doc.rect(20, 20, w - 40, h - 40).fill("#ffffff");

  logo(doc, 38, 40);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(navy).text("LEARNING ACADEMY", w - 190, 52, { width: 150, align: "right", lineBreak: false, characterSpacing: 1.5 });
  doc.font("Helvetica").fontSize(7.5).fillColor("#555").text("Learning that builds careers", w - 190, 66, { width: 150, align: "right", lineBreak: false });

  // banner bands
  for (const side of ["L", "R"]) {
    swoosh(doc, w, side, 118, 34, navy, 168);
    swoosh(doc, w, side, 154, 22, "#2a63b8", 178);
    swoosh(doc, w, side, 178, 16, ORANGE, 188);
    swoosh(doc, w, side, 196, 12, GREY, 198);
  }
  medal(doc, w / 2, 168, 44, "2026", navy, "#e8b008");

  center(doc, theme.title || "Certificate of Virtual Internship", 252, { size: 28, font: "Helvetica-Bold", color: navy, x: 20, width: w - 40 });
  center(doc, "This is to certify that", 300, { size: 13, color: "#222", x: 20, width: w - 40 });
  center(doc, String(cert.name).toUpperCase(), 326, { size: 22, font: "Helvetica", color: BLUE, x: 20, width: w - 40, spacing: 1 });
  center(doc, d.institute, 364, { size: 13.5, color: BLUE, x: 20, width: w - 40 });
  center(doc, `Roll No: ${d.rollNo}`, 386, { size: 10.5, color: "#444", x: 20, width: w - 40 });
  center(doc, d.duration, 412, { size: 13, color: "#222", x: 20, width: w - 40 });
  center(doc, d.program, 434, { size: 17, font: "Helvetica-Bold", color: "#111", x: 20, width: w - 40 });
  center(doc, d.period, 462, { size: 13, color: "#222", x: 20, width: w - 40 });
  center(doc, "May this Internship learning propel you toward a bright and successful career.", 492, { size: 10.5, color: "#222", x: 20, width: w - 40 });

  doc.font("Helvetica").fontSize(9).fillColor("#444").text("Supported by", 150, 528, { lineBreak: false });
  doc.rect(222, 518, 28, 28).fill(LIME);
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text("A", 222, 523, { width: 28, align: "center", lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(24).fillColor(navy).text("ALITS", 258, 518, { lineBreak: false, characterSpacing: 1 });
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#2a63b8").text("A C A D E M Y", 259, 541, { lineBreak: false });

  // signatures
  signature(doc, 68, 588, 1);
  signature(doc, 352, 586, 2);
  doc.moveTo(60, 634).lineTo(235, 634).lineWidth(0.8).strokeColor("#333").stroke();
  doc.moveTo(345, 634).lineTo(520, 634).lineWidth(0.8).strokeColor("#333").stroke();
  doc.font("Helvetica").fontSize(9).fillColor("#222");
  doc.text(d.signerLeft.name, 60, 640, { width: 175, align: "center", lineBreak: false });
  doc.text(d.signerLeft.title, 60, 653, { width: 175, align: "center", lineBreak: false });
  doc.text(d.signerRight.name, 345, 640, { width: 175, align: "center", lineBreak: false });
  doc.text(d.signerRight.title, 345, 653, { width: 175, align: "center", lineBreak: false });

  // QR + ids (bottom-left, like the reference layout)
  const qr = 104;
  if (qrBuf) doc.image(qrBuf, 40, 684, { width: qr, height: qr });
  doc.font("Helvetica").fontSize(9.5).fillColor("#222");
  doc.text(`Certificate ID : ${cert.certId}`, 160, 724, { lineBreak: false });
  doc.text(`Student ID: ${d.studentId}`, 160, 742, { lineBreak: false });
  doc.font("Helvetica").fontSize(7).fillColor("#666").text("Scan or upload at /verify", 160, 760, { lineBreak: false });

  // seal (red ALITS seal) + grade badge
  drawSeal(doc, 410, 735, 42, cert.sealShape || "round", d.year);
  doc.circle(508, 748, 30).fill("#1d4ea8");
  doc.circle(508, 748, 25).lineWidth(1).stroke("#ffffff");
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#ffffff").text(d.grade, 478, 737, { width: 60, align: "center", lineBreak: false });
  doc.font("Helvetica").fontSize(5.5).fillColor("#ffffff").text("GRADE", 478, 766, { width: 60, align: "center", lineBreak: false });

  // bottom-right orange wedge
  doc.polygon([w - 20, h - 62], [w - 20, h - 20], [w - 115, h - 20]).fill(ORANGE);
  doc.polygon([w - 20, h - 40], [w - 20, h - 20], [w - 70, h - 20]).fill("#2a63b8");

  doc.font("Helvetica").fontSize(5.8).fillColor("#333").text(
    "GRADE- O (Outstanding):90-100 | E (Excellent):80-89 | A (Very Good):70-79 | B (Good): 60-69 | C (Fair): 50-59 | D (Average): 40-49 | P (Pass): 30-39 | F (Fail): Below 30",
    28, h - 34, { width: w - 56, align: "center", lineBreak: false }
  );
  doc.font("Helvetica").fontSize(5.8).fillColor("#666").text(
    `Digitally signed by ALITS Registrar (Ed25519) · Integrity ${String(cert.hash || "").slice(0, 20)}…`,
    28, h - 26, { width: w - 56, align: "center", lineBreak: false }
  );
}
