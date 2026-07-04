import dotenv from "dotenv";

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

export const queryAi = async (action, payload) => {
  dotenv.config({ override: true });
  const fullPrompt = buildSystemPrompt(action, payload);

  const modelName = process.env.OPENROUTER_MODEL || "moonshotai/kimi-k2.7-code";
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not defined in environment variables");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "PairForge",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: modelName,
      max_tokens: 1000,
      messages: [
        { role: "user", content: fullPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errText}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenRouter");
  }

  return data.choices[0].message.content;
};
