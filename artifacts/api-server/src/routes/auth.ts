import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, signToken, generateResetToken } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { RegisterBody, LoginBody, UpdateProfileBody, ChangePasswordBody } from "@workspace/api-zod";

const router = Router();

// Admin credentials — when this email+password is used, role is forced to admin
const ADMIN_EMAIL = "mohanrajit05@gmail.com";
const ADMIN_PASSWORD = "Mohan@05";

router.post("/auth/register", asyncHandler(async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error: " + parsed.error.issues[0]?.message });
    return;
  }

  const { email, password, name } = parsed.data;

  const existing = await db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  // Determine role: admin for the predefined admin email
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const role = isAdmin ? "admin" as const : "user" as const;

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({ email, name, passwordHash, role }).returning();

  const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
  });
}));

router.post("/auth/login", asyncHandler(async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;

  // Check for hardcoded admin credentials first
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD) {
    // Find or create the admin user
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
    
    if (!user) {
      // Auto-create admin account if it doesn't exist
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      [user] = await db.insert(usersTable).values({
        email: ADMIN_EMAIL,
        name: "Admin",
        passwordHash,
        role: "admin",
      }).returning();
    } else {
      // Ensure role is admin
      if (user.role !== "admin") {
        await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id));
        user = { ...user, role: "admin" };
      }
    }

    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: "admin" });
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: "admin" as const, createdAt: user.createdAt.toISOString() },
    });
    return;
  }

  // Regular user login
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() },
  });
}));

router.get("/auth/profile", requireAuth, asyncHandler(async (req, res) => {
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt.toISOString() });
}));

router.patch("/auth/profile", requireAuth, asyncHandler(async (req, res) => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ name: parsed.data.name })
    .where(eq(usersTable.id, req.user!.userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, createdAt: updated.createdAt.toISOString() });
}));

router.post("/auth/change-password", requireAuth, asyncHandler(async (req, res) => {
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Validation error" });
    return;
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.id, req.user!.userId)).limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatch) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));

  res.json({ message: "Password updated successfully" });
}));

// ---- Forgot Password ----
router.post("/auth/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  
  // Always return success to prevent email enumeration
  if (!user) {
    res.json({ message: "If an account exists with that email, a reset link has been sent." });
    return;
  }

  const resetToken = generateResetToken();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.update(usersTable)
    .set({ resetToken, resetTokenExpiry: resetExpiry })
    .where(eq(usersTable.id, user.id));

  // In production, send email with reset link. For now, log it.
  console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
  console.log(`[Password Reset] Reset URL: /reset-password?token=${resetToken}`);

  res.json({ message: "If an account exists with that email, a reset link has been sent." });
}));

// ---- Reset Password ----
router.post("/auth/reset-password", asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  if (!token || typeof token !== "string") {
    res.status(400).json({ error: "Reset token is required" });
    return;
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
  
  if (!user) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    res.status(400).json({ error: "Reset token has expired. Please request a new one." });
    return;
  }

  const newHash = await bcrypt.hash(password, 12);
  await db.update(usersTable)
    .set({ passwordHash: newHash, resetToken: null, resetTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Password has been reset successfully" });
}));

export default router;
