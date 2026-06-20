import { useState } from "react";

/**
 * useAi — encapsulates all AI Intent Mode state and fetch logic.
 *
 * Keeps Room.jsx clean by extracting AI concerns into a dedicated hook.
 * The fetch pattern mirrors handleRunCode() in Room.jsx for consistency.
 *
 * @returns {{
 *   aiResponse: string,
 *   aiLoading: boolean,
 *   aiError: string,
 *   aiPrompt: string,
 *   setAiPrompt: Function,
 *   activeAction: string|null,
 *   triggerAi: Function,
 *   clearAi: Function,
 * }}
 */
export function useAi() {
  const [aiResponse, setAiResponse]     = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState("");
  const [aiPrompt, setAiPrompt]         = useState("");        // natural-language prompt for "generate"
  const [activeAction, setActiveAction] = useState(null);     // "explain"|"refactor"|"generate"|"debug"

  /**
   * Sends an AI request to the backend.
   * @param {{ action: string, code?: string, language?: string, stderr?: string }} params
   */
  const triggerAi = async ({ action, code, language, stderr = "" }) => {
    setAiLoading(true);
    setAiResponse("");
    setAiError("");
    setActiveAction(action);

    try {
      const res = await fetch("http://localhost:3000/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          code,
          language,
          prompt: aiPrompt,   // used only by "generate"
          stderr,             // used only by "debug"
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "AI request failed");
      }

      setAiResponse(data.result);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  /** Resets all AI state — used by the clear button in AiPanel. */
  const clearAi = () => {
    setAiResponse("");
    setAiError("");
    setActiveAction(null);
    setAiPrompt("");
  };

  return {
    aiResponse,
    aiLoading,
    aiError,
    aiPrompt,
    setAiPrompt,
    activeAction,
    triggerAi,
    clearAi,
  };
}
