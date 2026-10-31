/**
 * The QR printed on every ALITS certificate carries a compact, self-contained,
 * signed payload inside a verify URL:
 *
 *   https://<site>/verify?p=<base64url(JSON)>
 *
 * JSON keys: id, n(name), c(course), d(issueDate), i(issuer), t(template),
 *            s(sealShape), h(hmac hash), g(ed25519 signature)
 *
 * Phone cameras open the URL directly; the uploader decodes the payload locally.
 */
export function buildQrPayload(cert) {
  // Compact on purpose: a short QR (~49 modules) scans reliably from PDFs and photos.
  // The server checks the Ed25519 signature `g` against the registry record for `id`.
  const verifyBase = process.env.PUBLIC_VERIFY_URL || `${process.env.FRONTEND_URL}/verify`;
  return `${verifyBase}?id=${encodeURIComponent(cert.certId)}&g=${encodeURIComponent(cert.signature)}`;
}

export function parseQrPayloadParam(p) {
  try {
    const o = JSON.parse(Buffer.from(String(p), "base64url").toString("utf8"));
    return {
      certId: o.id,
      name: o.n,
      course: o.c,
      issueDate: o.d,
      issuer: o.i,
      template: o.t,
      sealShape: o.s || "round",
      hash: o.h,
      signature: o.g,
    };
  } catch {
    return null;
  }
}
