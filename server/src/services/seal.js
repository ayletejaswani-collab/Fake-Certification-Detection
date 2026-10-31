// The ALITS seal is always this exact red so scanners can find it on a photo.
export const SEAL_COLOR = "#d1202f";

function drawArcText(doc, text, radius, fontSize, position) {
  doc.font("Helvetica-Bold").fontSize(fontSize);
  const spacing = 1.4;
  const widths = [...text].map((ch) => doc.widthOfString(ch) + spacing);
  const total = widths.reduce((a, b) => a + b, 0);
  let cursor = -total / 2;
  [...text].forEach((ch, i) => {
    const w = widths[i];
    const mid = cursor + w / 2;
    cursor += w;
    const deg = ((position === "top" ? mid : -mid) / radius) * (180 / Math.PI);
    doc.save();
    doc.rotate(deg, { origin: [0, 0] });
    if (position === "top") doc.text(ch, -w / 2, -radius, { lineBreak: false });
    else doc.text(ch, -w / 2, radius - fontSize, { lineBreak: false });
    doc.restore();
  });
}

/** Official seal: ROUND (ringed, with arc text) or SQUARE (double-framed, sharp corners). */
export function drawSeal(doc, cx, cy, radius, shape, year) {
  doc.save();
  doc.translate(cx, cy);
  doc.fillColor(SEAL_COLOR).strokeColor(SEAL_COLOR);

  if (shape === "square") {
    const a = radius; // half side
    doc.lineJoin("miter").lineWidth(3.2).rect(-a, -a, a * 2, a * 2).stroke();
    doc.lineWidth(1).rect(-a + 7, -a + 7, (a - 7) * 2, (a - 7) * 2).stroke();
    doc.font("Helvetica-Bold").fontSize(6.8).text("OFFICIAL SEAL", -a + 8, -a + 12, {
      width: (a - 8) * 2,
      align: "center",
      lineBreak: false,
    });
    doc.font("Times-Bold").fontSize(21).text("ALITS", -a + 8, -9, {
      width: (a - 8) * 2,
      align: "center",
      lineBreak: false,
    });
    doc.lineWidth(0.8).moveTo(-a + 20, 14).lineTo(a - 20, 14).stroke();
    doc.font("Helvetica-Bold").fontSize(6.5).text(`VERIFIED ${year}`, -a + 8, a - 22, {
      width: (a - 8) * 2,
      align: "center",
      lineBreak: false,
    });
  } else {
    doc.lineWidth(3.2).circle(0, 0, radius).stroke();
    doc.lineWidth(1).circle(0, 0, radius - 15).stroke();
    drawArcText(doc, "ALITS OFFICIAL SEAL", radius - 4, 7.5, "top");
    drawArcText(doc, `VERIFIED  ${year}`, radius - 4, 7.5, "bottom");
    doc.font("Times-Bold").fontSize(19).text("ALITS", -radius, -8, {
      width: radius * 2,
      align: "center",
      lineBreak: false,
    });
    doc.lineWidth(0.8).moveTo(-radius + 24, 13).lineTo(radius - 24, 13).stroke();
  }
  doc.restore();
}

