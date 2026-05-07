import express from "express";
import { getWorkspacesByOwner, createWorkspace } from "../controllers/workspace.controller.js";

const router = express.Router();

router.get("/:ownerId", getWorkspacesByOwner);
router.post("/", createWorkspace);

export default router;
