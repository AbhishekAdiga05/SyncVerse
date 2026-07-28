import { useState, useCallback } from "react";
import { API_URL } from "../config.js";

const ACTION_LABELS = {
  explain: "Explain Code",
  refactor: "Refactor Code",
  generate: "Generate Code",
  debug: "Debug Error",
};

export function useAi(getToken) {
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [activeAction, setActiveAction] = useState(null);

  const triggerAi = useCallback(async ({ action, code, language, stderr = "" }) => {
    setAiLoading(true);
    setActiveAction(action);

    const entry = {
      id: Date.now(),
      action,
      label: ACTION_LABELS[action] || action,
      code,
      language,
      response: "",
      error: null,
      timestamp: new Date().toISOString(),
    };
    setConversation(prev => [entry, ...prev]);

    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, code, language, prompt: aiPrompt, stderr }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "AI request failed");
      }

      setConversation(prev => prev.map(e =>
        e.id === entry.id ? { ...e, response: data.result } : e
      ));
    } catch (err) {
      setConversation(prev => prev.map(e =>
        e.id === entry.id ? { ...e, error: err.message, response: "" } : e
      ));
    } finally {
      setAiLoading(false);
    }
  }, [getToken, aiPrompt]);

  const clearAi = useCallback(() => {
    setConversation([]);
    setAiPrompt("");
    setActiveAction(null);
  }, []);

  const removeEntry = useCallback((id) => {
    setConversation(prev => prev.filter(e => e.id !== id));
  }, []);

  return {
    conversation,
    aiLoading,
    aiError: conversation.find(e => e.error)?.error || null,
    aiPrompt,
    setAiPrompt,
    activeAction,
    triggerAi,
    clearAi,
    removeEntry,
  };
}
