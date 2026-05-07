import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { initializeYjsSockets } from "./sockets/yjs.socket.js";
import workspaceRoutes from "./routes/workspace.routes.js";

// 1. Initialize Database Connection
connectDB();

const app = express();

// 2. Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.static("public"));

const httpServer = createServer(app);

// 3. Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 4. Initialize Yjs Sockets
initializeYjsSockets(io);

// 5. Routes
app.use("/api/workspaces", workspaceRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "ok",
        success: true
    });
});

// 6. Start Server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
