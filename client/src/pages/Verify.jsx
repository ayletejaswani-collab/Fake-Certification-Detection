import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CircleDot, FileUp, Keyboard, ShieldAlert, ShieldCheck, ShieldX, Square } from "lucide-react";
import api from "../api/client";
import PublicLayout from "../components/PublicLayout";
import CertificateArt from "../components/CertificateArt";
import StatusBadge from "../components/StatusBadge";
import VerdictSlam from "../components/VerdictSlam";
import TiltFrame from "../components/TiltFrame";
import HashDecode from "../components/HashDecode";
import LedgerReveal from "../components/LedgerReveal";
import ScanEnter from "../components/ScanEnter";
import { analyzeCertificateFile } from "../utils/scanQrFile";

const icons = {
  genuine: ShieldCheck,
  offline_valid: ShieldCheck,
  revoked: ShieldAlert,
  tampered: ShieldX,
  fake: ShieldX,
  not_found: ShieldX,
  offline_invalid: ShieldX,
};

const CHECK_LABELS = {
  qr_found: "QR found",
  signature: "ALITS signature",
  hash: "Integrity hash",
  registry: "Registry record",
  record_match: "Record matches",
  seal: "Seal shape",
  not_revoked: "Not revoked",
};

export default function Verify() {
  const [params] = useSearchParams();
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [readingFile, setReadingFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [slam, setSlam] = useState(null);
  const scannerRef = useRef(null);
  const fileRef = useRef(null);

  async function runUpload({ qr, seal, source, id }) {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/api/verify/upload", {
        qr: qr || undefined,
        certId: id || undefined,
        seal,
        source,
        fileName,
      });
      setResult(data);
      setSlam({ result: data.result, key: Date.now() });
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  // Opened from a phone-camera scan of the certificate QR (…/verify?p=… or ?id=…)
  useEffect(() => {
    if (params.get("p") || params.get("id")) {
      runUpload({ qr: window.location.href, source: "camera" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUpload(file) {
    if (!file) return;
    setError("");
    setResult(null);
    setPreview("");
    setFileName(file.name);
    setReadingFile(true);
    try {
      const { qr, seal, preview: img } = await analyzeCertificateFile(file);
      setPreview(img);
      setReadingFile(false);
      await runUpload({ qr, seal, source: "upload" });
    } catch {
      setError("Could not read this file. Upload a PDF or a JPG/PNG/WebP image of the certificate.");
    } finally {
      setReadingFile(false);
    }
  }

  async function startCamera() {
    setError("");
    setScanning(true);
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start({ facingMode: "environment" }, { fps: 8, qrbox: 240 }, async (text) => {
        await stopCamera();
        setPreview("");
        await runUpload({ qr: text, source: "camera" });
      });
    } catch {
      setError("Camera permission denied or unavailable in this browser.");
      setScanning(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        /* already stopped */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  const Icon = result ? icons[result.result] || ShieldAlert : null;
  const ok = result?.result === "genuine";
  const warn = result?.result === "revoked";

  return (
    <PublicLayout>
      {slam && <VerdictSlam key={slam.key} result={slam.result} />}
      {(busy || readingFile) && <div className="verify-scan" />}
      <ScanEnter>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#baff39]">
          <HashDecode text="Public registry" />
        </p>
        <h1 className="page-title mt-2">
          <HashDecode text="Certificate verification" delay={80} />
        </h1>
        <p className="muted mt-2 max-w-2xl text-base">
          Upload a certificate from your device (PDF, JPG, PNG or WebP). ALITS reads the signed QR,
          checks the cryptographic signature and registry, and inspects the round or square seal to
          tell you if it is real, fake or revoked.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <LedgerReveal className="space-y-5">
            <div
              className="card cursor-pointer p-6 md:p-8"
              style={{ outline: dragOver ? "2px solid #baff39" : undefined }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                onUpload(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white">
                <FileUp className="h-4 w-4 text-[#baff39]" /> Upload certificate
              </div>
              <p className="muted mt-3">
                Drop the certificate file here, or choose one from your device. A clear scan or photo
                that shows the QR code and the seal works best.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              <button
                type="button"
                className="btn-lime mt-5"
                disabled={readingFile}
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                {readingFile ? "Scanning QR & seal…" : "Choose file"}
              </button>
              {fileName && <p className="mt-3 text-xs text-neutral-400">Selected: {fileName}</p>}
            </div>

            <div className="card p-6 md:p-8">
              <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-white">
                <Keyboard className="h-4 w-4 text-[#baff39]" /> Or type the ID / use the camera
              </div>
              <div className="mt-4">
                <label htmlFor="certId">Certificate ID</label>
                <input
                  id="certId"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  placeholder="e.g. ALITS-2026-REAL01"
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="btn-lime" disabled={busy || !certId.trim()} onClick={() => runUpload({ id: certId.trim(), source: "manual" })}>
                  {busy ? "Checking registry…" : "Verify online"}
                </button>
                <button className="btn-ghost" onClick={scanning ? stopCamera : startCamera}>
                  <Camera className="h-4 w-4" />
                  {scanning ? "Stop camera" : "Use camera"}
                </button>
              </div>
              <div id="qr-reader" className="mt-5" />
              {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
              <p className="muted mt-6">
                Demo IDs: <span className="font-mono text-neutral-300">ALITS-2026-REAL01</span>,{" "}
                <span className="font-mono text-neutral-300">FAKE-999-XXXX</span>,{" "}
                <span className="font-mono text-neutral-300">ALITS-2026-REVOK1</span>
              </p>
            </div>
          </LedgerReveal>

          <LedgerReveal delay={120}>
            {!result && (
              <div className="card flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
                <ShieldCheck className="h-10 w-10 text-neutral-600" />
                <p className="mt-4 font-extrabold uppercase text-white">Result appears here</p>
                <p className="muted mt-2">Upload a certificate to see Real, Fake or Revoked.</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div
                  className={`card result-pop p-6 ${ok ? "ring-2 ring-emerald-400" : warn ? "ring-2 ring-amber-400" : "ring-2 ring-rose-400"}`}
                >
                  <div className="flex items-start gap-3">
                    {Icon && (
                      <Icon className={`h-9 w-9 ${ok ? "text-emerald-400" : warn ? "text-amber-400" : "text-rose-400"}`} />
                    )}
                    <div>
                      <p className={`text-2xl font-extrabold ${ok ? "text-emerald-400" : warn ? "text-amber-400" : "text-rose-400"}`}>
                        {result.verdict}
                      </p>
                      <p className="muted mt-1">{result.message}</p>
                    </div>
                  </div>
                  {result.reasons?.length > 0 && result.result !== "genuine" && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-300">
                      {result.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {result.checks && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {Object.entries(result.checks).map(([key, pass]) => (
                        <span
                          key={key}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            pass === null
                              ? "bg-white/10 text-neutral-400"
                              : pass
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {CHECK_LABELS[key] || key} {pass === null ? "not checked" : pass ? "pass" : "fail"}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.seal && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-neutral-300">
                      {result.seal.shape === "square" ? (
                        <Square className="h-4 w-4 text-[#baff39]" />
                      ) : (
                        <CircleDot className="h-4 w-4 text-[#baff39]" />
                      )}
                      {result.seal.found
                        ? `Seal detected: ${result.seal.shape}${result.seal.expected ? ` · issued as ${result.seal.expected}` : ""}`
                        : "No seal detected in the upload (signature and registry decide the verdict)."}
                    </div>
                  )}
                </div>
                {preview && (
                  <div className="card overflow-hidden p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                      Your upload
                    </p>
                    <img src={preview} alt="Uploaded certificate preview" className="w-full rounded" />
                  </div>
                )}
                {result.certificate && (
                  <>
                    <TiltFrame>
                      <CertificateArt
                        compact
                        name={result.certificate.name}
                        course={result.certificate.course}
                        issueDate={result.certificate.issueDate}
                        issuer={result.certificate.issuer}
                        certId={result.certificate.certId}
                        template={result.certificate.template}
                        status={result.certificate.status}
                      />
                    </TiltFrame>
                    <div className="card p-5 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">Official record (from the signed QR)</p>
                        <StatusBadge value={result.certificate.status || result.result} />
                      </div>
                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-neutral-500">Holder</dt>
                          <dd className="font-medium text-white">{result.certificate.name}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-neutral-500">Issued</dt>
                          <dd className="font-medium text-white">{result.certificate.issueDate}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-xs text-neutral-500">Integrity hash</dt>
                          <dd className="break-all font-mono text-[11px] text-neutral-400">{result.certificate.hash}</dd>
                        </div>
                        {result.certificate.ethTxHash && (
                          <div className="sm:col-span-2">
                            <dt className="text-xs text-neutral-500">Ethereum Sepolia</dt>
                            <dd>
                              <a
                                className="text-xs text-[#baff39]"
                                href={`https://sepolia.etherscan.io/tx/${result.certificate.ethTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View stamp on Etherscan
                              </a>
                            </dd>
                          </div>
                        )}
                      </dl>
                      <p className="mt-4 text-xs text-neutral-400">
                        Confirm that the name and course printed on your document match this record. A
                        genuine QR copied onto a different document still shows the original holder here.
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </LedgerReveal>
        </div>
      </div>
      </ScanEnter>
    </PublicLayout>
  );
}
