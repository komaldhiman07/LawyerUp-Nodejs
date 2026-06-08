import express from "express";
import notificationController from "./notification.controller";

const router = express.Router();

// PATCH /notification/read-all — must be registered BEFORE /:id/read to avoid route conflict
router.patch("/read-all", notificationController.markAllAsRead);

// GET  /notification/list
router.get("/list", notificationController.list);

// PATCH /notification/:id/read
router.patch("/:id/read", notificationController.markAsRead);

export default router;
