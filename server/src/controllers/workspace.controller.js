import Workspace from "../models/Workspace.model.js";

// Fetch workspaces for the dashboard
export const getWorkspacesByOwner = async (req, res) => {
    try {
        const workspaces = await Workspace.find({ ownerId: req.params.ownerId })
            .sort({ updatedAt: -1 })
            .limit(20);
        res.status(200).json({ success: true, workspaces });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Fetch a single workspace by roomId (for the Room page header)
export const getWorkspaceByRoom = async (req, res) => {
    try {
        const workspace = await Workspace.findOne({ roomId: req.params.roomId });
        if (!workspace) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Create a new workspace manually (so we can attach an owner)
export const createWorkspace = async (req, res) => {
    try {
        const { roomId, ownerId, name } = req.body;
        const workspace = await Workspace.create({
            roomId,
            ownerId,
            name: name || "Untitled Workspace",
        });
        res.status(201).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// Update workspace name or language
export const updateWorkspace = async (req, res) => {
    try {
        const { roomId } = req.params;
        const updates = req.body; // { name?, language? }
        const workspace = await Workspace.findOneAndUpdate(
            { roomId },
            updates,
            { new: true }
        );
        res.status(200).json({ success: true, workspace });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


// Delete a workspace by roomId
export const deleteWorkspace = async (req, res) => {
    try {
        const { roomId } = req.params;
        await Workspace.findOneAndDelete({ roomId });
        res.status(200).json({ success: true, message: "Workspace deleted" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};