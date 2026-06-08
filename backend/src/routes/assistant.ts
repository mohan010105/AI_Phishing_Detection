import { Router } from "express";
import { db } from "../database/index.js";
import { assistantChatsTable } from "../database/index.js";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { chatWithAssistant, ChatMessage, AiAssistantError, getAiProviderStatus } from "../services/aiAssistant.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../lib/logger.js";

const router = Router();

router.post("/assistant/chat", requireAuth, asyncHandler(async (req, res) => {
  const message: string = req.body?.message;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const userId = req.user!.userId;

  const recentRows = await db
    .select()
    .from(assistantChatsTable)
    .where(eq(assistantChatsTable.userId, userId))
    .orderBy(desc(assistantChatsTable.createdAt))
    .limit(20);

  const history: ChatMessage[] = recentRows
    .reverse()
    .map(r => ({ role: r.role as "user" | "assistant", content: r.content }));

  await db.insert(assistantChatsTable).values({ userId, role: "user", content: message.trim() });

  try {
    const reply = await chatWithAssistant(message.trim(), history);
    await db.insert(assistantChatsTable).values({ userId, role: "assistant", content: reply });
    res.json({ reply });
  } catch (err) {
    if (err instanceof AiAssistantError) {
      logger.warn({ code: err.code, message: err.message }, "AI Assistant returned a classified error");
      res.status(503).json({ error: err.message, code: err.code });
    } else {
      logger.error({ err }, "Unexpected error in AI assistant chat");
      res.status(500).json({ error: "An unexpected error occurred with the AI assistant. Please try again." });
    }
  }
}));

// --- Test endpoint for verifying AI connectivity ---
router.post("/test-ai", asyncHandler(async (req, res) => {
  const message = req.body?.message || "Hello, are you working?";

  const providers = getAiProviderStatus();
  logger.info({ providers }, "AI test endpoint called");

  try {
    const reply = await chatWithAssistant(message, []);
    res.json({
      success: true,
      reply,
      providers,
    });
  } catch (err) {
    if (err instanceof AiAssistantError) {
      res.status(503).json({
        success: false,
        error: err.message,
        code: err.code,
        providers,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Unexpected error during AI test",
        providers,
      });
    }
  }
}));

router.get("/assistant/history", requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const rows = await db
    .select()
    .from(assistantChatsTable)
    .where(eq(assistantChatsTable.userId, userId))
    .orderBy(desc(assistantChatsTable.createdAt))
    .limit(100);

  res.json({
    messages: rows.reverse().map(r => ({
      id: r.id,
      role: r.role,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}));

router.delete("/assistant/history", requireAuth, asyncHandler(async (req, res) => {
  await db
    .delete(assistantChatsTable)
    .where(eq(assistantChatsTable.userId, req.user!.userId));
  res.json({ success: true });
}));

export default router;
