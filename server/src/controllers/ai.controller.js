import { queryGemini } from "../services/gemini.service.js";

const VALID_ACTIONS = ["explain", "refactor", "generate", "debug"];

/**
 * POST /api/ai
 * Handles all four AI Intent Mode actions.
 * Mirrors the pattern of runCode() in execution.controller.js.
 *
 * Request body:
 *   action   {string}  — "explain" | "refactor" | "generate" | "debug"
 *   code     {string}  — Editor content (or selection). Required for all except "generate"
 *   language {string}  — Monaco language ID e.g. "javascript", "python"
 *   prompt   {string}  — Natural language prompt. Required for "generate"
 *   stderr   {string}  — Error output from Judge0. Required for "debug"
 *
 * Response: { success: true, result: "<AI markdown string>" }
 */
export const handleAiRequest = async (req, res) => {
  try {
    const { action, code, language, prompt, stderr } = req.body;

    // ── Validate action ──────────────────────────────────────────────────────
    if (!action || !VALID_ACTIONS.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid or missing "action". Must be one of: ${VALID_ACTIONS.join(", ")}`,
      });
    }

    // ── Validate required fields per action ──────────────────────────────────
    if (action === "generate" && !prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: `"prompt" is required for the "generate" action`,
      });
    }

    if (action !== "generate" && !code?.trim()) {
      return res.status(400).json({
        success: false,
        message: `"code" is required for the "${action}" action`,
      });
    }

    // ── Delegate to service ──────────────────────────────────────────────────
    const aiResponse = await queryGemini(action, { code, language, prompt, stderr });

    return res.status(200).json({
      success: true,
      result: aiResponse,
    });
  } catch (error) {
    console.error(`[AI] Gemini request failed:`, error.message);

    return res.status(500).json({
      success: false,
      message: "AI request failed",
      error: error.message,
    });
  }
};
