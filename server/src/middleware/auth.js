import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;

// Build authorized parties from CORS_ORIGIN env variable + localhost defaults
// This tells Clerk which frontend domains are allowed to send session tokens
const buildAuthorizedParties = () => {
  const defaults = ["http://localhost:5173", "http://localhost:3000"];
  if (!process.env.CORS_ORIGIN) return defaults;
  const fromEnv = process.env.CORS_ORIGIN.split(",").map((s) => s.trim());
  return [...new Set([...defaults, ...fromEnv])];
};

const authorizedParties = buildAuthorizedParties();

export const requireAuth = async (req, res, next) => {
  try {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const clerkReq = { headers: req.headers, method: req.method, url: fullUrl };
    const state = await clerkClient.authenticateRequest(clerkReq, {
      publishableKey: PUBLISHABLE_KEY,
      authorizedParties,
    });
    if (!state.isSignedIn) {
      return res.status(401).json({ success: false, message: "Invalid or expired session token" });
    }
    req.auth = { userId: state.toAuth().userId };
    next();
  } catch (err) {
    console.error("[Auth] Error:", err?.message || err);
    return res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
};
