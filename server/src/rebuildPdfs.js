import "dotenv/config";
import { connectDb } from "./config/db.js";
import { Certificate } from "./models/Certificate.js";
import { generateCertificatePdf } from "./services/pdf.js";
import { buildQrPayload } from "./utils/qrPayload.js";

async function run() {
  await connectDb(process.env.MONGODB_URI);
  const certs = await Certificate.find();
  for (const cert of certs) {
    cert.qrPayload = buildQrPayload(cert);
    const verifyUrl = `${process.env.FRONTEND_URL}/verify?id=${encodeURIComponent(cert.certId)}`;
    cert.pdfPath = await generateCertificatePdf(cert, verifyUrl);
    await cert.save();
    console.log("Rebuilt", cert.certId);
  }
  console.log(`Updated ${certs.length} PDFs`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
