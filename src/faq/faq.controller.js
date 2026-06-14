import { RESPONSE_CODES, ROLE_IDS } from "../../config/constants";
import Faq from "../../database/models/Faq";

const ADMIN_ROLE_ID = ROLE_IDS.ADMIN;

function isAdmin(req) {
  const role = req && req.user && req.user.data ? req.user.data.role_id : null;
  if (!role) return false;
  if (typeof role === "string") return role === ADMIN_ROLE_ID;
  if (role._id && role._id.toString() === ADMIN_ROLE_ID) return true;
  if (role.name && role.name.toLowerCase() === "admin") return true;
  return false;
}

class FaqController {
  /* GET /faq/list — app-facing: active FAQs, grouped + ordered. */
  list = async (req, res) => {
    try {
      const faqs = await Faq.find({ is_deleted: false, is_active: true })
        .select("question answer category order")
        .sort({ category: 1, order: 1, createdAt: 1 })
        .lean();
      return res.status(RESPONSE_CODES.GET).json({
        success: true,
        message: "FAQs fetched successfully",
        data: faqs,
      });
    } catch (err) {
      console.error("[FaqController.list]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };

  /* GET /faq/admin/list — admin: all FAQs incl. inactive. */
  adminList = async (req, res) => {
    if (!isAdmin(req)) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    try {
      const faqs = await Faq.find({ is_deleted: false })
        .sort({ category: 1, order: 1, createdAt: 1 })
        .lean();
      return res.status(RESPONSE_CODES.GET).json({
        success: true,
        message: "FAQs fetched successfully",
        data: faqs,
        recordsTotal: faqs.length,
      });
    } catch (err) {
      console.error("[FaqController.adminList]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };

  /* POST /faq — admin create. */
  create = async (req, res) => {
    if (!isAdmin(req)) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    try {
      const { question, answer, category, order, is_active } = req.body;
      if (!question || !answer) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: "question and answer are required" });
      }
      const created = await Faq.create({
        question: question.trim(),
        answer: answer.trim(),
        category: (category || "General").trim(),
        order: Number.isFinite(order) ? order : 0,
        is_active: is_active !== false,
        created_by: req.user.data._id,
        updated_by: req.user.data._id,
      });
      return res.status(RESPONSE_CODES.POST).json({ success: true, message: "FAQ created", data: created });
    } catch (err) {
      console.error("[FaqController.create]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };

  /* PUT /faq/:id — admin update. */
  update = async (req, res) => {
    if (!isAdmin(req)) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    try {
      const existing = await Faq.findOne({ _id: req.params.id, is_deleted: false });
      if (!existing) return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: "FAQ not found" });

      const { question, answer, category, order, is_active } = req.body;
      const patch = { updated_by: req.user.data._id };
      if (question !== undefined) patch.question = String(question).trim();
      if (answer !== undefined) patch.answer = String(answer).trim();
      if (category !== undefined) patch.category = String(category).trim();
      if (order !== undefined) patch.order = Number(order) || 0;
      if (is_active !== undefined) patch.is_active = !!is_active;

      const updated = await Faq.findByIdAndUpdate(req.params.id, patch, { new: true });
      return res.status(RESPONSE_CODES.POST).json({ success: true, message: "FAQ updated", data: updated });
    } catch (err) {
      console.error("[FaqController.update]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };

  /* PUT /faq/reorder — admin: persist new order. Body: { items:[{id,order}] }. */
  reorder = async (req, res) => {
    if (!isAdmin(req)) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: "items array required" });
      }
      const ops = items
        .filter((it) => it && it.id)
        .map((it) => ({
          updateOne: {
            filter: { _id: it.id },
            update: { order: Number(it.order) || 0, updated_by: req.user.data._id },
          },
        }));
      if (ops.length) await Faq.bulkWrite(ops);
      return res.status(RESPONSE_CODES.GET).json({ success: true, message: "Reordered", data: { updated: ops.length } });
    } catch (err) {
      console.error("[FaqController.reorder]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };

  /* DELETE /faq/:id — admin soft delete. */
  remove = async (req, res) => {
    if (!isAdmin(req)) return res.status(RESPONSE_CODES.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
    try {
      const existing = await Faq.findOne({ _id: req.params.id, is_deleted: false });
      if (!existing) return res.status(RESPONSE_CODES.BAD_REQUEST).json({ success: false, message: "FAQ not found" });
      await Faq.findByIdAndUpdate(req.params.id, { is_deleted: true, updated_by: req.user.data._id });
      return res.status(RESPONSE_CODES.GET).json({ success: true, message: "FAQ deleted" });
    } catch (err) {
      console.error("[FaqController.remove]", err);
      return res.status(RESPONSE_CODES.SERVER_ERROR).json({ success: false, message: "Server error" });
    }
  };
}

export default new FaqController();
