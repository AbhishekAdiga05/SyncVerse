import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const PUBLISHABLE_KEY = process.env.VITE_CLERK_PUBLISHABLE_KEY;

export const requireAuth = async (req, res, next) => {
  try {
    const fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const clerkReq = { headers: req.headers, method: req.method, url: fullUrl };
    const state = await clerkClient.authenticateRequest(clerkReq, {
      publishableKey: PUBLISHABLE_KEY,
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
