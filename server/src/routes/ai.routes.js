import express from "express";
import { handleAiRequest } from "../controllers/ai.controller.js";

const router = express.Router();

// POST /api/ai
// Body: { action, code?, language?, prompt?, stderr? }
// The "action" field determines behaviour — same pattern as Judge0 using "languageId"
router.post("/", handleAiRequest);

export default router;
