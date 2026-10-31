/**
 * ALITS seal detector (pure — works on raw RGBA pixels, no DOM needed).
 *
 * Every ALITS certificate carries an official red seal that is either ROUND or
 * SQUARE. We:
 *   1. mask strongly red pixels,
 *   2. grow them slightly and group them into connected blobs,
 *   3. pick the roughly square-bounded blob (the seal),
 *   4. measure its outer edge radius at 72 angles and fit it to a circle model
 *      (constant radius) and a square model (r = h / cos(δ), any rotation),
 *   5. the better fit decides round vs square.
 */
const BINS = 72;

function redMask(data, w, h) {
  const mask = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = r;
    if (g > r || b > r) continue;
    const min = Math.min(g, b);
    const d = max - min;
    if (max < 115 || d < 0.5 * max) continue; // dark or washed-out
    // hue within ±24° of pure red
    const hue = (60 * (g - b)) / d;
    if (hue > 24 || hue < -24) continue;
    mask[p] = 1;
  }
  return mask;
}

function dilate(mask, w, h, passes = 2) {
  let cur = mask;
  for (let n = 0; n < passes; n += 1) {
    const next = new Uint8Array(w * h);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const p = y * w + x;
        if (cur[p]) {
          next[p] = 1;
          continue;
        }
        let hit = 0;
        for (let dy = -1; dy <= 1 && !hit; dy += 1) {
          const yy = y + dy;
          if (yy < 0 || yy >= h) continue;
          for (let dx = -1; dx <= 1; dx += 1) {
            const xx = x + dx;
            if (xx < 0 || xx >= w) continue;
            if (cur[yy * w + xx]) {
              hit = 1;
              break;
            }
          }
        }
        next[p] = hit;
      }
    }
    cur = next;
  }
  return cur;
}

function components(mask, w, h) {
  const label = new Int32Array(w * h);
  const blobs = [];
  const stack = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || label[start]) continue;
    const id = blobs.length + 1;
    const blob = { id, minX: w, maxX: 0, minY: h, maxY: 0, count: 0 };
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p / w) | 0;
      blob.count += 1;
      if (x < blob.minX) blob.minX = x;
      if (x > blob.maxX) blob.maxX = x;
      if (y < blob.minY) blob.minY = y;
      if (y > blob.maxY) blob.maxY = y;
      if (x > 0 && mask[p - 1] && !label[p - 1]) (label[p - 1] = id), stack.push(p - 1);
      if (x < w - 1 && mask[p + 1] && !label[p + 1]) (label[p + 1] = id), stack.push(p + 1);
      if (y > 0 && mask[p - w] && !label[p - w]) (label[p - w] = id), stack.push(p - w);
      if (y < h - 1 && mask[p + w] && !label[p + w]) (label[p + w] = id), stack.push(p + w);
    }
    blobs.push(blob);
  }
  return { label, blobs };
}

function radialProfile(label, blob, w) {
  const cx = (blob.minX + blob.maxX) / 2;
  const cy = (blob.minY + blob.maxY) / 2;
  const rmax = new Float64Array(BINS);
  for (let y = blob.minY; y <= blob.maxY; y += 1) {
    for (let x = blob.minX; x <= blob.maxX; x += 1) {
      if (label[y * w + x] !== blob.id) continue;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      let bin = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * BINS);
      if (bin >= BINS) bin = BINS - 1;
      if (r > rmax[bin]) rmax[bin] = r;
    }
  }
  return { cx, cy, rmax };
}

function fitErrors(rmax) {
  const rs = [];
  const angs = [];
  for (let i = 0; i < BINS; i += 1) {
    if (rmax[i] > 0) {
      rs.push(rmax[i]);
      angs.push(((i + 0.5) / BINS) * 2 * Math.PI);
    }
  }
  const n = rs.length;
  const sumSq = rs.reduce((a, r) => a + r * r, 0);
  const mean = rs.reduce((a, r) => a + r, 0) / n;
  const circle = rs.reduce((a, r) => a + (r - mean) ** 2, 0) / sumSq;

  let square = Infinity;
  for (let deg = 0; deg < 90; deg += 1.5) {
    const phi = (deg * Math.PI) / 180;
    let num = 0;
    let den = 0;
    const f = angs.map((a) => {
      let d = (((a - phi) % (Math.PI / 2)) + Math.PI / 2) % (Math.PI / 2);
      d -= Math.PI / 4; // -45°..45°
      return 1 / Math.cos(d);
    });
    for (let i = 0; i < n; i += 1) {
      num += rs[i] * f[i];
      den += f[i] * f[i];
    }
    const hHalf = num / den;
    let err = 0;
    for (let i = 0; i < n; i += 1) err += (rs[i] - hHalf * f[i]) ** 2;
    square = Math.min(square, err / sumSq);
  }
  return { circle, square, coverage: n / BINS };
}

/**
 * @returns {{found:boolean, shape:"round"|"square"|null, confidence:number, bbox?:object}}
 */
export function detectSeal(data, w, h) {
  const base = redMask(data, w, h);
  const mask = dilate(base, w, h, 2);
  const { label, blobs } = components(mask, w, h);
  const minSide = Math.min(w, h);

  const candidates = blobs
    .map((b) => ({ ...b, bw: b.maxX - b.minX + 1, bh: b.maxY - b.minY + 1 }))
    .filter((b) => {
      const ratio = b.bw / b.bh;
      return (
        b.bw >= minSide * 0.05 &&
        b.bh >= minSide * 0.05 &&
        b.bw <= minSide * 0.6 &&
        ratio > 0.7 &&
        ratio < 1.43 &&
        b.count / (b.bw * b.bh) > 0.03
      );
    })
    .sort((a, b) => b.bw * b.bh - a.bw * a.bh);

  for (const blob of candidates) {
    const { rmax } = radialProfile(label, blob, w);
    const { circle, square, coverage } = fitErrors(rmax);
    const best = Math.min(circle, square);
    if (coverage < 0.8 || best > 0.02) continue; // not a closed, regular outline
    const shape = circle <= square ? "round" : "square";
    const worst = Math.max(circle, square);
    return {
      found: true,
      shape,
      confidence: Math.round((1 - best / (worst + 1e-9)) * 100) / 100,
      fit: { circle: +circle.toFixed(5), square: +square.toFixed(5) },
      bbox: { x: blob.minX, y: blob.minY, w: blob.bw, h: blob.bh },
    };
  }
  return { found: false, shape: null, confidence: 0 };
}
