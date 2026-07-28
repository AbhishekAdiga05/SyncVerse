import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { initializeYjsSockets } from "./sockets/yjs.socket.js";
import { initializeChatSockets } from "./sockets/chat.socket.js";
import { requireAuth } from "./middleware/auth.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import executionRoutes from "./routes/execution.routes.js";
import aiRoutes from "./routes/ai.routes.js";


import helmet from "helmet";

// 1. Initialize Database Connection
const app = express();
app.use(helmet()); // Secure HTTP headers

// 2. CORS configuration
const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(s => s.trim())
    : "*";

app.use(cors({ origin: corsOrigins }));
app.use(express.json()); // Parses incoming JSON requests
app.use(express.static("public"));

// 3. Rate limiting on expensive endpoints
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests, please try again later." },
});

app.use("/api/execution", apiLimiter);
app.use("/api/ai", apiLimiter);
app.use("/api/workspaces", apiLimiter);

const httpServer = createServer(app);

// 4. Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigins,
        methods: ["GET", "POST"]
    }
});

// 5. Initialize Yjs + Chat Sockets
initializeYjsSockets(io);
initializeChatSockets(io);

// 6. Health endpoint (public — before auth middleware)
app.get("/health", (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatus = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
    res.status(dbState === 1 ? 200 : 503).json({
        message: dbState === 1 ? "ok" : "degraded",
        success: dbState === 1,
        db: dbStatus[dbState] || "unknown",
        uptime: process.uptime(),
    });
});

// 7. Authentication — protect all /api routes
app.use("/api", requireAuth);

// 8. Routes
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/execution", executionRoutes);
app.use("/api/ai", aiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[Error]: ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

// 7. Start Server
const PORT = process.env.PORT || 3000;
(async () => {
    try {
        await connectDB();
    } catch (e) {
        console.error(`Failed to connect to database: ${e.message}`);
        process.exit(1);
    }
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
})();
