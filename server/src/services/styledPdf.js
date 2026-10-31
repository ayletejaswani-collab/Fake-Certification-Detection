import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { drawLandscape, drawPortrait } from "./designs.js";

/** Renders a styled ALITS certificate PDF with the signed QR and red seal. */
export async function generateStyledPdf({ cert, layout, details, theme, outPath }) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const qrBuf = await QRCode.toBuffer(cert.qrPayload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 800,
    color: { dark: "#000000", light: "#ffffff" },
  });

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: layout === "portrait" ? "portrait" : "landscape",
      margin: 0,
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
    try {
      if (layout === "portrait") drawPortrait(doc, cert, details, qrBuf, theme);
      else drawLandscape(doc, cert, details, qrBuf, theme);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
  return outPath;
}
