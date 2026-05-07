import express from "express";
import {
  getWorkspacesByOwner,
  getWorkspaceByRoom,
  createWorkspace,
  deleteWorkspace,
  updateWorkspace,
} from "../controllers/workspace.controller.js";

const router = express.Router();

router.get("/by-room/:roomId", getWorkspaceByRoom);  // Must be before /:ownerId
router.get("/:ownerId", getWorkspacesByOwner);
router.post("/", createWorkspace);
router.delete("/:roomId", deleteWorkspace);
router.patch("/:roomId", updateWorkspace);

export default router;
