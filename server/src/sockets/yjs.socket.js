import { YSocketIO } from "y-socket.io/dist/server";
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

            const yText = doc.getText("monaco");

            // The client's Monaco editor might have injected its "defaultValue" 
            // while we were waiting for MongoDB. We need to clear it and forcefully 
            // apply the actual database code.
            const dbCode = workspace.code || "// Start coding collaboratively here...";
            if (yText.toString() !== dbCode) {
                yText.delete(0, yText.length); // Erase any race-condition text
                yText.insert(0, dbCode);       // Inject database text
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
                await Workspace.findOneAndUpdate(
                    { roomId },
                    { code: yText },
                    { upsert: true }
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
            await Workspace.findOneAndUpdate(
                { roomId },
                { code: yText },
                { upsert: true }
            );
            console.log(`💾 Final Save: Room ${roomId} saved to database upon closing`);
        } catch (error) {
            console.error("Error saving document on destroy:", error);
        }
    });
};
