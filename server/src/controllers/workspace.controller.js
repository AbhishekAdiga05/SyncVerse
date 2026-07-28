import Workspace from "../models/Workspace.model.js";

const ALLOWED_UPDATES = ["name", "language", "code"];

export const getWorkspacesByOwner = async (req, res, next) => {
    try {
        if (req.auth.userId !== req.params.ownerId) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        const workspaces = await Workspace.find({ ownerId: req.params.ownerId })
            .sort({ updatedAt: -1 })
            .limit(20);
        res.status(200).json({ success: true, workspaces });
    } catch (error) {
        next(error);
    }
};

export const getWorkspaceByRoom = async (req, res, next) => {
    try {
        const workspace = await Workspace.findOne({ roomId: req.params.roomId });
        if (!workspace) return res.status(404).json({ success: false, message: "Not found" });
        res.status(200).json({ success: true, workspace });
    } catch (error) {
        next(error);
    }
};

export const createWorkspace = async (req, res, next) => {
    try {
        const { roomId, name, language } = req.body;
        if (!roomId || typeof roomId !== "string") {
            return res.status(400).json({ success: false, message: "roomId is required" });
        }
        const workspace = await Workspace.create({
            roomId,
            ownerId: req.auth.userId,
            name: typeof name === "string" ? name.trim().slice(0, 100) || "Untitled Workspace" : "Untitled Workspace",
            language: typeof language === "string" ? language.toLowerCase().slice(0, 20) || "javascript" : "javascript",
        });
        res.status(201).json({ success: true, workspace });
    } catch (error) {
        next(error);
    }
};

export const updateWorkspace = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const workspace = await Workspace.findOne({ roomId });
        if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });
        if (workspace.ownerId && workspace.ownerId !== req.auth.userId) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        const updates = {};
        for (const key of ALLOWED_UPDATES) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const updated = await Workspace.findOneAndUpdate(
            { roomId },
            updates,
            { new: true, timestamps: true }
        );
        res.status(200).json({ success: true, workspace: updated });
    } catch (error) {
        next(error);
    }
};

export const deleteWorkspace = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const workspace = await Workspace.findOne({ roomId });
        if (!workspace) return res.status(404).json({ success: false, message: "Workspace not found" });
        if (workspace.ownerId && workspace.ownerId !== req.auth.userId) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }
        await Workspace.findOneAndDelete({ roomId });
        res.status(200).json({ success: true, message: "Workspace deleted" });
    } catch (error) {
        next(error);
    }
};
