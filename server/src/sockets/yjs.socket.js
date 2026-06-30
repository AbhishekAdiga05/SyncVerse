import { YSocketIO } from "y-socket.io/dist/server";
import * as Y from "yjs";
import Workspace from "../models/Workspace.model.js";

export const initializeYjsSockets = (io) => {
    const ySocketIO = new YSocketIO(io);
    ySocketIO.initialize();

    // 1. Load data from MongoDB when a room is opened
    ySocketIO.on("document-loaded", async (doc) => {
        const roomId = doc.name; 
        try {
            let workspace = await Workspace.findOne({ roomId });
            
            if (!workspace) {
                workspace = await Workspace.create({ roomId });
            }

            // Restore full Yjs state (monaco + tldraw + everything else)
            if (workspace.ydocState) {
                try {
                    Y.applyUpdate(doc, new Uint8Array(workspace.ydocState.buffer));
                } catch (e) {
                    console.error(`Failed to restore Yjs state for room ${roomId}:`, e.message);
                    // Fall through to legacy code-only injection
                }
            }

            // If no ydocState or restoration failed, inject from legacy code field
            const yText = doc.getText("monaco");
            const dbCode = workspace.code || "// Start coding collaboratively here...";
            if (yText.toString() !== dbCode) {
                yText.delete(0, yText.length);
                yText.insert(0, dbCode);
            }
        } catch (error) {
            console.error("Error loading document:", error);
        }
    });

    // 2. Auto-save to MongoDB when people type
    const saveTimers = {};

    ySocketIO.on("document-update", (doc) => {
        const roomId = doc.name;
        const yText = doc.getText("monaco").toString();

        // Clear existing timer for this room
        if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]);

        // Set a new timer to save after 2 seconds of no typing (debounce)
        saveTimers[roomId] = setTimeout(async () => {
            try {
                const fullState = Y.encodeStateAsUpdate(doc);
                await Workspace.findOneAndUpdate(
                    { roomId },
                    { code: yText, ydocState: Buffer.from(fullState) },
                    { upsert: true, timestamps: true }
                );
                console.log(`💾 Debounce Save: Room ${roomId} saved to database`);
            } catch (error) {
                console.error("Error saving document:", error);
            }
        }, 2000); 
    });

    // 3. Save immediately when the last user leaves the room (e.g., on Refresh)
    ySocketIO.on("document-destroy", async (doc) => {
        const roomId = doc.name;
        const yText = doc.getText("monaco").toString();

        if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]);

        try {
            const fullState = Y.encodeStateAsUpdate(doc);
            await Workspace.findOneAndUpdate(
                { roomId },
                { code: yText, ydocState: Buffer.from(fullState) },
                { upsert: true, timestamps: true }
            );
            console.log(`💾 Final Save: Room ${roomId} saved to database upon closing`);
        } catch (error) {
            console.error("Error saving document on destroy:", error);
        }
    });
};
