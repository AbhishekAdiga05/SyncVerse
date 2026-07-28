import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const publicPaths = ["/health"];

export const requireAuth = async (req, res, next) => {
  if (publicPaths.includes(req.path)) return next();

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Missing or invalid authorization header" });
  }

  const token = header.slice(7);

  try {
    const { sub } = await clerkClient.verifyToken(token);
    req.auth = { userId: sub };
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session token" });
  }
};
