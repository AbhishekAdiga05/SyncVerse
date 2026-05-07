const encodeBase64 = (value = "") => {
  return Buffer.from(value, "utf-8").toString("base64");
};

const decodeBase64 = (value) => {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf-8");
};

export const runCodeWithJudge0 = async ({ sourceCode, languageId, stdin = "" }) => {
  const judge0Url = process.env.JUDGE0_API_URL;

  if (!judge0Url) {
    throw new Error("JUDGE0_API_URL is not configured");
  }

  const response = await fetch(
    `${judge0Url}/submissions?base64_encoded=true&wait=true`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        source_code: encodeBase64(sourceCode),
        language_id: languageId,
        stdin: encodeBase64(stdin)
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 request failed: ${errorText}`);
  }

  const result = await response.json();

  return {
    stdout: decodeBase64(result.stdout),
    stderr: decodeBase64(result.stderr),
    compileOutput: decodeBase64(result.compile_output),
    message: decodeBase64(result.message),
    status: result.status,
    time: result.time,
    memory: result.memory
  };
};
