import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { ensureKeyPair } from "./utils/crypto.js";
import { ensureGenesis } from "./services/blockchain.js";
import authRoutes from "./routes/auth.js";
import certificateRoutes from "./routes/certificates.js";
import verifyRoutes from "./routes/verify.js";
import analyticsRoutes from "./routes/analytics.js";
import ethereumRoutes from "./routes/ethereum.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "ALITS CertiChain",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ethereum", ethereumRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Server error" });
});

const port = Number(process.env.PORT || 5000);

async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.HMAC_SECRET) {
    console.error("Missing MONGODB_URI, JWT_SECRET or HMAC_SECRET in server/.env");
    process.exit(1);
  }
  await connectDb(process.env.MONGODB_URI);
  ensureKeyPair();
  await ensureGenesis();

  const listen = (attempt = 1) => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`CertiChain API listening on ${port}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE" && attempt < 8) {
        console.warn(`Port ${port} in use, retry ${attempt}/8`);
        setTimeout(() => listen(attempt + 1), 750);
        return;
      }
      console.error(error);
      process.exit(1);
    });
  };
  listen();
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
