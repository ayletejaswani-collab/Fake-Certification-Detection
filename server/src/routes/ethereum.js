import { Router } from "express";
import { Certificate } from "../models/Certificate.js";
import { protect, authorize } from "../middleware/auth.js";
import { ethereumStatus, publishHash, readOnChain, explorerBase } from "../services/ethereum.js";

const router = Router();

router.get("/status", protect, authorize("superadmin", "issuer"), async (_req, res) => {
  res.json(await ethereumStatus());
});

router.get("/:certId", async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  const chain = await readOnChain(req.params.certId);
  res.json({
    certId: req.params.certId,
    ethTxHash: cert?.ethTxHash || "",
    ethNetwork: cert?.ethNetwork || "",
    explorer: cert?.ethTxHash ? `${explorerBase()}/tx/${cert.ethTxHash}` : null,
    onChain: chain,
  });
});

router.post("/:certId/stamp", protect, authorize("superadmin", "issuer"), async (req, res) => {
  const cert = await Certificate.findOne({ certId: req.params.certId });
  if (!cert) return res.status(404).json({ message: "Certificate not found" });
  if (cert.ethTxHash) {
    return res.json({
      already: true,
      txHash: cert.ethTxHash,
      explorer: `${explorerBase()}/tx/${cert.ethTxHash}`,
    });
  }
  const eth = await publishHash(cert.certId, cert.hash);
  if (eth.published) {
    cert.ethTxHash = eth.txHash;
    cert.ethNetwork = eth.network;
    await cert.save();
  }
  res.json(eth);
});

export default router;
