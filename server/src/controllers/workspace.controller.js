import Workspace from "../models/Workspace.model.js";

// Fetch workspaces for the dashboard
export const getWorkspacesByOwner = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ ownerId: req.params.ownerId })
            .sort({ updatedAt: -1 })
            .limit(10);
        res.status(200).json({ success: true, workspaces });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create a new workspace manually (so we can attach an owner)
export const createWorkspace = async (req, res) => {
    try {
        const { roomId, ownerId } = req.body;
        const workspace = await Workspace.create({ roomId, ownerId });
        res.status(201).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
