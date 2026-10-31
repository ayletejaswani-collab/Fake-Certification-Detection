import jsQR from "jsqr";
import * as pdfjsLib from "pdfjs-dist";
import { detectSeal } from "./sealDetect";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

function binarize(imageData) {
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    const v = g > 150 ? 255 : 0;
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  return imageData;
}

function decodeCanvas(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { width, height } = canvas;
  if (width < 20 || height < 20) return null;
  const raw = ctx.getImageData(0, 0, width, height);
  const first = jsQR(raw.data, width, height, { inversionAttempts: "attemptBoth" });
  if (first?.data) return first.data;
  const bw = binarize(ctx.getImageData(0, 0, width, height));
  const second = jsQR(bw.data, width, height, { inversionAttempts: "attemptBoth" });
  return second?.data || null;
}

function crop(source, sx, sy, sw, sh, scale = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(32, Math.round(sw * scale));
  canvas.height = Math.max(32, Math.round(sh * scale));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = scale < 1.5;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function scanRegions(source) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  for (const target of [1, 1600 / w, 1100 / w]) {
    if (target > 1.01) continue;
    const full = decodeCanvas(crop(source, 0, 0, w, h, Math.min(1, target)));
    if (full) return full;
  }

  const regions = [
    [w * 0.72, h * 0.62, w * 0.28, h * 0.38, 3.2],
    [w * 0.65, h * 0.55, w * 0.35, h * 0.45, 2.6],
    [w * 0.78, h * 0.7, w * 0.22, h * 0.3, 4],
    [0, h * 0.55, w * 0.35, h * 0.45, 2.6],
    [w * 0.65, 0, w * 0.35, h * 0.4, 2.6],
    [w * 0.4, h * 0.4, w * 0.6, h * 0.6, 2],
  ];
  for (const [x, y, rw, rh, scale] of regions) {
    const found = decodeCanvas(crop(source, x, y, rw, rh, scale));
    if (found) return found;
  }
  return null;
}

function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image"));
    };
    img.src = url;
  });
}

/** Downscale to <=1100px and look for the red ALITS seal (round or square). */
function sealFromSource(source) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const k = Math.min(1, 1100 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(32, Math.round(w * k));
  canvas.height = Math.max(32, Math.round(h * k));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return detectSeal(data, canvas.width, canvas.height);
}

function previewFrom(source) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const k = Math.min(1, 720 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Reads an uploaded certificate (PDF or image) fully in the browser:
 *   qr   – decoded QR text (or null)
 *   seal – { found, shape: "round" | "square" | null, confidence }
 *   preview – small JPEG data URL for display
 */
export async function analyzeCertificateFile(file) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  let qr = null;
  let seal = { found: false, shape: null, confidence: 0 };
  let preview = "";

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 3.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const canvasContext = canvas.getContext("2d", { willReadFrequently: true });
      await page.render({ canvasContext, canvas, viewport }).promise;
      if (pageNum === 1) preview = previewFrom(canvas);
      if (!qr) qr = scanRegions(canvas);
      if (!seal.found) seal = sealFromSource(canvas);
      if (qr && seal.found) break;
    }
  } else {
    const image = await fileToImage(file);
    preview = previewFrom(image);
    qr = scanRegions(image);
    seal = sealFromSource(image);
  }
  return { qr, seal, preview };
}

async function scanPdf(file) {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 3.4 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const canvasContext = canvas.getContext("2d", { willReadFrequently: true });
    await page.render({ canvasContext, canvas, viewport }).promise;
    const found = scanRegions(canvas);
    if (found) return found;
  }
  return null;
}

export async function scanQrFromFile(file) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    return scanPdf(file);
  }
  const image = await fileToImage(file);
  return scanRegions(image);
}

export function parseQrText(text) {
  try {
    const payload = JSON.parse(text);
    return {
      certId: payload.id || payload.certId || "",
      hash: payload.hash || payload.h || "",
      payload,
    };
  } catch {
    try {
      const url = new URL(text, window.location.origin);
      return { certId: url.searchParams.get("id") || "", hash: url.searchParams.get("h") || "" };
    } catch {
      return { certId: text.trim(), hash: "" };
    }
  }
}
