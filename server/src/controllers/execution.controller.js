import { runCodeWithJudge0 } from "../services/judge0.service.js";

export const runCode = async (req, res, next) => {
  try {
    const { sourceCode, languageId, stdin } = req.body;

    if (!sourceCode || !languageId) {
      return res.status(400).json({
        success: false,
        message: "sourceCode and languageId are required",
      });
    }

    const result = await runCodeWithJudge0({
      sourceCode,
      languageId,
      stdin,
    });

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    next(error);
  }
};
