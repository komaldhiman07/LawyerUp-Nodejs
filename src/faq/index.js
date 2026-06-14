import express from "express";
import faqController from "./faq.controller";

const router = express.Router();

// App-facing
router.get("/list", faqController.list);

// Admin (guarded inside the controller via isAdmin)
router.get("/admin/list", faqController.adminList);
router.post("/", faqController.create);
// /reorder must precede /:id so it isn't captured as an id.
router.put("/reorder", faqController.reorder);
router.put("/:id", faqController.update);
router.delete("/:id", faqController.remove);

export default router;
