import { useState } from "react";
import { API_URL } from "../config.js";

export function useAi(getToken) {
  const [aiResponse, setAiResponse]     = useState("");
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState("");
  const [aiPrompt, setAiPrompt]         = useState("");
  const [activeAction, setActiveAction] = useState(null);

  const triggerAi = async ({ action, code, language, stderr = "" }) => {
    setAiLoading(true);
    setAiResponse("");
    setAiError("");
    setActiveAction(action);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action,
          code,
          language,
          prompt: aiPrompt,
          stderr,
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
