import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["superadmin", "issuer", "student"], default: "student" },
    organization: { type: String, default: "ALITS Institute of Excellence" },
    phone: { type: String, default: "" },
    notifyEmail: { type: Boolean, default: true },
    notifySms: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    organization: this.organization,
    phone: this.phone,
    notifyEmail: this.notifyEmail,
    notifySms: this.notifySms,
  };
};

export const User = mongoose.model("User", userSchema);
