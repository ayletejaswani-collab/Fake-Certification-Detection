/**
 * Generates test certificates into ./samples so you can try the upload page:
 *   real_round.pdf      -> Real       (ALITS-2026-REAL01)
 *   real_square.pdf     -> Real       (ALITS-2026-WORK01, square seal)
 *   revoked.pdf         -> Revoked    (ALITS-2026-REVOK1)
 *   fake_tampered.pdf   -> Fake       (name edited, signature no longer valid)
 *   fake_no_qr.pdf      -> Fake       (looks real, no signed QR)
 *   fake_wrong_seal.pdf -> Fake       (genuine QR, but wrong seal shape)
 * Run after `npm run seed`:  npm run samples --prefix server
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectDb } from "./config/db.js";
import { Certificate } from "./models/Certificate.js";
import { generateCertificatePdf } from "./services/pdf.js";
import { buildQrPayload } from "./utils/qrPayload.js";

const OUT = path.resolve("samples");

async function run() {
  await connectDb(process.env.MONGODB_URI);
  fs.mkdirSync(OUT, { recursive: true });
  const get = async (id) => {
    const c = await Certificate.findOne({ certId: id });
    if (!c) throw new Error(`${id} missing — run npm run seed first`);
    return c.toObject();
  };
  const url = `${process.env.FRONTEND_URL}/verify`;
  const make = (cert, name, opts = {}) =>
    generateCertificatePdf(cert, url, { ...opts, outPath: path.join(OUT, name) });

  const real = await get("ALITS-2026-REAL01");
  await make(real, "real_round.pdf");
  await make(await get("ALITS-2026-WORK01"), "real_square.pdf");
  await make(await get("ALITS-2026-REVOK1"), "revoked.pdf");

  const forged = { ...real, name: "Rahul Verma" }; // keep old hash + signature
  forged.qrPayload = buildQrPayload(forged);
  await make(forged, "fake_tampered.pdf");
  await make({ ...real, certId: "ALITS-2026-FORGED" }, "fake_no_qr.pdf", { noQr: true });
  await make(real, "fake_wrong_seal.pdf", { sealOverride: "square" });

  console.log("Sample files written to", OUT);
  process.exit(0);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
