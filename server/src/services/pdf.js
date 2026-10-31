import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, "../../uploads/certs");

const PALETTES = {
  academic: {
    ink: "#1b1530",
    gold: "#b8860b",
    wine: "#6b1d36",
    cream: "#f7f1e3",
    label: "Certificate of Academic Distinction",
  },
  workshop: {
    ink: "#10233d",
    gold: "#c9a227",
    wine: "#1d4e6b",
    cream: "#eef4f8",
    label: "Certificate of Workshop Completion",
  },
  internship: {
    ink: "#14221a",
    gold: "#8a6d3b",
    wine: "#2f5d3a",
    cream: "#f3efe4",
    label: "Certificate of Internship",
  },
};

import { drawSeal, SEAL_COLOR } from "./seal.js";
export { drawSeal, SEAL_COLOR };

export async function buildQrDataUrl(payload) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 420,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * opts (used only by the sample generator for test forgeries):
 *   noQr        – omit the QR code entirely
 *   sealOverride – draw this seal shape instead of the issued one
 */
export async function generateCertificatePdf(cert, verifyUrl, opts = {}) {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filePath = opts.outPath || path.join(UPLOAD_DIR, `${cert.certId}.pdf`);
  const qr = opts.noQr ? null : await buildQrDataUrl(cert.qrPayload);
  const theme = PALETTES[cert.template] || PALETTES.academic;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);

    const w = doc.page.width;
    const h = doc.page.height;

    doc.rect(0, 0, w, h).fill(theme.cream);
    doc.lineWidth(14).strokeColor(theme.ink).rect(18, 18, w - 36, h - 36).stroke();
    doc.lineWidth(3).strokeColor(theme.gold).rect(28, 28, w - 56, h - 56).stroke();
    doc.lineWidth(1).strokeColor(theme.wine).rect(36, 36, w - 72, h - 72).stroke();

    doc.fillColor(theme.gold).font("Times-Bold").fontSize(13).text("ALITS INSTITUTE OF EXCELLENCE", 0, 52, {
      align: "center",
    });
    doc.fillColor(theme.ink).font("Times-Roman").fontSize(10).text("ESTABLISHED FOR THE ADVANCEMENT OF VERIFIABLE MERIT", {
      align: "center",
    });

    doc.moveDown(0.8);
    doc.fillColor(theme.wine).font("Times-Bold").fontSize(28).text(theme.label, { align: "center" });
    doc.moveTo(w / 2 - 120, doc.y + 6).lineTo(w / 2 + 120, doc.y + 6).strokeColor(theme.gold).lineWidth(1.2).stroke();

    doc.moveDown(1.2);
    doc.fillColor(theme.ink).font("Times-Italic").fontSize(12).text("This is to certify that", { align: "center" });
    doc.moveDown(0.35);
    doc.fillColor(theme.ink).font("Times-Bold").fontSize(32).text(cert.name, { align: "center" });
    doc.moveDown(0.3);
    doc.font("Times-Roman").fontSize(13).fillColor(theme.ink).text(
      `has successfully completed ${cert.course}${cert.grade ? ` with distinction (${cert.grade})` : ""}`,
      { align: "center", width: w - 220, x: 110 }
    );

    doc.moveDown(0.8);
    doc.fontSize(11).text(`Issued on ${cert.issueDate}  ·  Authority: ${cert.issuer}`, { align: "center" });
    doc.moveDown(0.2);
    doc.fillColor(theme.ink).font("Times-Bold").fontSize(10).text(`Certificate ID  ${cert.certId}`, { align: "center" });

    const qrSize = 132;
    const qrX = w - 56 - qrSize;
    const qrY = h - 58 - qrSize;
    if (qr) {
      doc.rect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 22).fill("#ffffff");
      const qrBuf = Buffer.from(qr.split(",")[1], "base64");
      doc.image(qrBuf, qrX, qrY, { width: qrSize, height: qrSize });
      doc.fillColor(theme.ink).font("Times-Roman").fontSize(8).text("Scan to verify", qrX, qrY + qrSize + 2, {
        width: qrSize,
        align: "center",
      });
    }

    const sealShape = opts.sealOverride || cert.sealShape || "round";
    const year = String(cert.issueDate || "").match(/\d{4}/)?.[0] || new Date().getFullYear();
    drawSeal(doc, w / 2, h - 122, 48, sealShape, year);

    doc.fillColor(theme.ink).fontSize(8).text("Registrar", 70, h - 118);
    doc.moveTo(70, h - 128).lineTo(200, h - 128).strokeColor(theme.ink).lineWidth(0.8).stroke();
    doc.font("Times-Italic").fontSize(9).text(cert.issuer, 70, h - 112, { width: 160 });

    doc.font("Times-Roman").fontSize(7).fillColor("#555").text(
      `Digitally signed by ALITS Registrar (Ed25519)  ·  HMAC ${String(cert.hash || "").slice(0, 24)}…  ·  Chain #${cert.chainIndex >= 0 ? cert.chainIndex : "pending"}  ·  ${verifyUrl}`,
      48,
      h - 52,
      { width: w - 220 }
    );

    doc.end();
  });

  return filePath;
}
