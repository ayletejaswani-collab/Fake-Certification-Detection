import { Router } from "express";
import { User } from "../models/User.js";
import { protect, signToken, authorize } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "An account with this email already exists" });
  const user = await User.create({ name, email, password, phone, role: "student" });
  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (!user.isActive) return res.status(403).json({ message: "Account is disabled" });
  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.patch("/me", protect, async (req, res) => {
  const { name, phone, notifyEmail, notifySms } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  if (notifyEmail !== undefined) req.user.notifyEmail = notifyEmail;
  if (notifySms !== undefined) req.user.notifySms = notifySms;
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
});

router.post("/issuers", protect, authorize("superadmin"), async (req, res) => {
  const { name, email, password, organization, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: "Email already in use" });
  const user = await User.create({
    name,
    email,
    password,
    phone,
    organization: organization || "ALITS Institute of Excellence",
    role: "issuer",
  });
  res.status(201).json({ user: user.toSafeJSON() });
});

router.get("/users", protect, authorize("superadmin"), async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).select("-password");
  res.json({
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization,
      phone: u.phone,
      isActive: u.isActive,
    })),
  });
});

export default router;
