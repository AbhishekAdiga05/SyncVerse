import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialise once — reused across all requests
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Builds a focused system prompt for each AI action.
 * All prompt engineering lives here — easy to iterate without touching controllers.
 *
 * @param {"explain"|"refactor"|"generate"|"debug"} action
 * @param {{ code?: string, language?: string, prompt?: string, stderr?: string }} payload
 * @returns {string} The full prompt string sent to Gemini
 */
function buildSystemPrompt(action, { code, language, prompt, stderr }) {
  const lang = language || "plaintext";

  switch (action) {
    case "explain":
      return (
        `You are an expert ${lang} developer acting as a code tutor.\n` +
        `Explain the following code concisely. Focus on WHAT it does and WHY, not a line-by-line walkthrough.\n` +
        `Use markdown with headers and bullet points. Keep it under 200 words.\n\n` +
        `\`\`\`${lang}\n${code}\n\`\`\``
      );

    case "refactor":
      return (
        `You are an expert ${lang} developer. Refactor the following code for readability, performance, and best practices.\n` +
        `Return the refactored code in a fenced code block, followed by a brief "What changed" section in markdown.\n\n` +
        `\`\`\`${lang}\n${code}\n\`\`\``
      );

    case "generate":
      return (
        `You are an expert ${lang} developer. Generate clean, well-commented ${lang} code for the following request.\n` +
        `Return ONLY a fenced code block — no prose before it.\n\n` +
        `Request: ${prompt}`
      );

    case "debug":
      return (
        `You are an expert ${lang} debugger. Given the code and its error output below, identify the root cause and provide a corrected version.\n` +
        `Format your response as:\n` +
        `1. **Root Cause** (1–2 sentences)\n` +
        `2. **Fixed Code** (fenced code block)\n` +
        `3. **Explanation** (what the fix does)\n\n` +
        `Code:\n\`\`\`${lang}\n${code}\n\`\`\`\n\n` +
        `Error output:\n\`\`\`\n${stderr}\n\`\`\``
      );

    default:
      throw new Error(`Unknown AI action: "${action}"`);
  }
}

/**
 * Core Gemini dispatcher. All AI actions route through this function.
 * Mirrors the pattern of runCodeWithJudge0() in judge0.service.js.
 *
 * @param {"explain"|"refactor"|"generate"|"debug"} action
 * @param {{ code?: string, language?: string, prompt?: string, stderr?: string }} payload
 * @returns {Promise<string>} The AI's markdown text response
 */
export const queryGemini = async (action, payload) => {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });

  const fullPrompt = buildSystemPrompt(action, payload);
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
};
