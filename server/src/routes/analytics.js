import { Router } from "express";
import { Certificate } from "../models/Certificate.js";
import { VerificationLog } from "../models/VerificationLog.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";
import { getChain } from "../services/blockchain.js";
import { ethereumStatus } from "../services/ethereum.js";

const router = Router();
router.use(protect, authorize("superadmin", "issuer"));

function certScope(user) {
  return user.role === "issuer" ? { issuerId: user._id } : {};
}

router.get("/overview", async (req, res) => {
  const scope = certScope(req.user);
  const [total, active, revoked, logs, users, notifications, chain] = await Promise.all([
    Certificate.countDocuments(scope),
    Certificate.countDocuments({ ...scope, status: "active" }),
    Certificate.countDocuments({ ...scope, status: "revoked" }),
    VerificationLog.find().sort({ createdAt: -1 }).limit(400),
    req.user.role === "superadmin" ? User.countDocuments() : Promise.resolve(null),
    Notification.find().sort({ createdAt: -1 }).limit(20),
    getChain(12),
  ]);

  const scopedIds = new Set(
    (await Certificate.find(scope).select("certId")).map((c) => c.certId)
  );
  const relevant = req.user.role === "issuer" ? logs.filter((l) => scopedIds.has(l.certId)) : logs;

  const fakeAttempts = relevant.filter((l) =>
    ["not_found", "tampered", "offline_invalid", "fake"].includes(l.result)
  ).length;
  const genuine = relevant.filter((l) => ["genuine", "offline_valid"].includes(l.result)).length;

  const byDay = {};
  relevant.forEach((log) => {
    const day = new Date(log.createdAt).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { day, genuine: 0, fake: 0, revoked: 0 };
    if (["genuine", "offline_valid"].includes(log.result)) byDay[day].genuine += 1;
    else if (log.result === "revoked") byDay[day].revoked += 1;
    else byDay[day].fake += 1;
  });

  const templates = await Certificate.aggregate([
    { $match: scope },
    { $group: { _id: "$template", count: { $sum: 1 } } },
  ]);

  res.json({
    totals: {
      certificates: total,
      active,
      revoked,
      verifications: relevant.length,
      genuine,
      fakeAttempts,
      users,
    },
    series: Object.values(byDay).sort((a, b) => a.day.localeCompare(b.day)).slice(-14),
    templates: templates.map((t) => ({ template: t._id, count: t.count })),
    recentLogs: relevant.slice(0, 12),
    notifications,
    chain,
    ethereum: await ethereumStatus(),
    stamped: await Certificate.countDocuments({ ...scope, ethTxHash: { $ne: "" } }),
  });
});

export default router;
