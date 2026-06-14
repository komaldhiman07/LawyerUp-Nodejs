import { matchedData } from "express-validator";
import adminLawsService from "./adminLaws.service";
import { RESPONSE_CODES, ROLE_IDS } from "../../config/constants";
import { CUSTOM_MESSAGES } from "../../config/customMessages";
import { classifyLegality, penaltySeverity } from "../helpers/lawClassifier";
import { STATE_NAME_BY_CODE } from "../helpers/usStates";

const ADMIN_ROLE_ID = ROLE_IDS.ADMIN;

class AdminLawsController {
  constructor() {}

  isAdmin = (req) => {
    const role = req && req.user && req.user.data ? req.user.data.role_id : null;
    if (!role) {
      return false;
    }
    if (typeof role === "string") {
      return role === ADMIN_ROLE_ID;
    }
    if (role._id && role._id.toString() === ADMIN_ROLE_ID) {
      return true;
    }
    if (role.name && role.name.toLowerCase() === "admin") {
      return true;
    }
    return false;
  };

  unauthorizedResponse = () => ({
    status: RESPONSE_CODES.UNAUTHORIZED,
    success: false,
    message: CUSTOM_MESSAGES.UNAUTHORIZED,
    data: {},
  });

  getDashboardStats = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const data = await adminLawsService.getDashboardStats();
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
    };
  };

  listLawMaster = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const { query } = req;
    const filter = {
      is_deleted: false,
    };
    if (query.q) {
      // I-03: Use $text index instead of regex — avoids collection scan
      filter.$text = { $search: query.q.trim() };
    }
    if (query.domain) {
      filter.domain = query.domain.trim();
    }
    const options = {
      skip: query.start ? parseInt(query.start, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };
    const { data, total } = await adminLawsService.paginateLawMaster(filter, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  createLawMaster = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const data = matchedData(req);
    const existing = await adminLawsService.getLawMaster({
      law_key: data.law_key.trim().toLowerCase(),
      is_deleted: false,
    });
    if (existing) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_ALREADY_EXISTS,
        data: {},
      };
    }
    const payload = {
      ...data,
      law_key: data.law_key.trim().toLowerCase(),
      created_by: req.user.data._id,
      updated_by: req.user.data._id,
      source_type: "manual",
    };
    const created = await adminLawsService.createLawMaster(payload);
    await adminLawsService.createAuditLog({
      entity_type: "laws_master",
      entity_id: created._id,
      action: "create",
      changed_fields: Object.keys(payload),
      after_data: created.toObject(),
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
      data: created,
    };
  };

  updateLawMaster = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const data = matchedData(req);
    const existing = await adminLawsService.getLawMaster({
      _id: req.params.id,
      is_deleted: false,
    });
    if (!existing) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const payload = {
      ...data,
      updated_by: req.user.data._id,
    };
    const updated = await adminLawsService.updateLawMaster(req.params.id, payload);
    await adminLawsService.createAuditLog({
      entity_type: "laws_master",
      entity_id: existing._id,
      action: "update",
      changed_fields: Object.keys(payload),
      before_data: existing.toObject(),
      after_data: updated ? updated.toObject() : null,
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_UPDATE_SUCCESS,
      data: updated,
    };
  };

  listStateLaws = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const { query } = req;
    const filter = {
      is_deleted: false,
    };
    if (query.q) {
      // I-03: Use $text index instead of regex — avoids collection scan
      filter.$text = { $search: query.q.trim() };
    }
    if (query.state_code) {
      filter.state_code = query.state_code.trim().toUpperCase();
    }
    if (query.law_key) {
      filter.law_key = query.law_key.trim().toLowerCase();
    }
    if (query.status) {
      filter.status = query.status.trim().toLowerCase();
    }
    const options = {
      skip: query.start ? parseInt(query.start, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };
    const { data, total } = await adminLawsService.paginateStateLaws(filter, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  createStateLaw = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const data = matchedData(req);
    const state_code = data.state_code.trim().toUpperCase();
    const law_key = data.law_key.trim().toLowerCase();
    const latest = await adminLawsService.getLatestStateLaw(state_code, law_key);
    const payload = {
      ...data,
      state_code,
      law_key,
      version: latest ? latest.version + 1 : 1,
      created_by: req.user.data._id,
      updated_by: req.user.data._id,
      change_source: "manual",
    };
    // Auto-derive verdict / severity when the admin didn't set them explicitly.
    if (!payload.legality) payload.legality = classifyLegality(law_key, payload.summary);
    if (!payload.penalty_severity) {
      payload.penalty_severity = penaltySeverity(payload.penalty_text);
    }
    const created = await adminLawsService.createStateLaw(payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: created._id,
      action: "create",
      changed_fields: Object.keys(payload),
      after_data: created.toObject(),
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
      data: created,
    };
  };

  updateStateLaw = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const data = matchedData(req);
    const existing = await adminLawsService.getStateLawById(req.params.id);
    if (!existing || existing.is_deleted) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const versionedFields = ["title", "summary", "details", "penalty_text", "status", "effective_from", "effective_to"];
    let shouldBumpVersion = false;
    versionedFields.forEach((field) => {
      if (data[field] !== undefined && String(data[field]) !== String(existing[field] || "")) {
        shouldBumpVersion = true;
      }
    });
    const payload = {
      ...data,
      updated_by: req.user.data._id,
    };
    if (shouldBumpVersion) {
      payload.version = (existing.version || 1) + 1;
    }
    // Re-derive verdict / severity when the source text changed and the admin
    // didn't override them in this request.
    if (data.summary !== undefined && data.legality === undefined) {
      payload.legality = classifyLegality(existing.law_key, data.summary);
    }
    if (data.penalty_text !== undefined && data.penalty_severity === undefined) {
      payload.penalty_severity = penaltySeverity(data.penalty_text);
    }
    const updated = await adminLawsService.updateStateLaw(req.params.id, payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: existing._id,
      action: "update",
      changed_fields: Object.keys(payload),
      before_data: existing.toObject(),
      after_data: updated ? updated.toObject() : null,
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    if (shouldBumpVersion && updated) {
      adminLawsService.notifyAffectedUsers(updated, "update", req.user.data._id, {
        penaltyBefore: existing.penalty_text,
        penaltyAfter:  updated.penalty_text,
      }).catch(console.error);
    }
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_UPDATE_SUCCESS,
      data: updated,
    };
  };

  publishStateLaw = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const existing = await adminLawsService.getStateLawById(req.params.id);
    if (!existing || existing.is_deleted) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const payload = {
      status: "active",
      is_active: true,
      published_at: new Date(),
      updated_by: req.user.data._id,
    };
    const updated = await adminLawsService.updateStateLaw(req.params.id, payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: existing._id,
      action: "publish",
      changed_fields: Object.keys(payload),
      before_data: existing.toObject(),
      after_data: updated ? updated.toObject() : null,
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    if (updated) {
      adminLawsService.notifyAffectedUsers(updated, "publish", req.user.data._id).catch(console.error);
    }
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_PUBLISHED_SUCCESS,
      data: updated,
    };
  };

  repealStateLaw = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const existing = await adminLawsService.getStateLawById(req.params.id);
    if (!existing || existing.is_deleted) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const payload = {
      status: "repealed",
      is_active: false,
      effective_to: existing.effective_to || new Date(),
      updated_by: req.user.data._id,
    };
    const updated = await adminLawsService.updateStateLaw(req.params.id, payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: existing._id,
      action: "repeal",
      changed_fields: Object.keys(payload),
      before_data: existing.toObject(),
      after_data: updated ? updated.toObject() : null,
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    if (updated) {
      adminLawsService.notifyAffectedUsers(updated, "repeal", req.user.data._id).catch(console.error);
    }
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_REPEALED_SUCCESS,
      data: updated,
    };
  };

  deleteStateLaw = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const existing = await adminLawsService.getStateLawById(req.params.id);
    if (!existing || existing.is_deleted) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const payload = {
      is_deleted: true,
      is_active: false,
      updated_by: req.user.data._id,
    };
    const updated = await adminLawsService.updateStateLaw(req.params.id, payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: existing._id,
      action: "delete",
      changed_fields: Object.keys(payload),
      before_data: existing.toObject(),
      after_data: updated ? updated.toObject() : null,
      changed_by: req.user.data._id,
      source: "admin_portal",
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_DELETE_SUCCESS,
      data: {},
    };
  };

  listAdminUsers = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const { query } = req;
    const filter = {
      is_deleted: false,
      role_id: { $ne: ADMIN_ROLE_ID },
    };
    if (query.status) filter.status = query.status;
    if (query.state)  filter.state  = new RegExp(`^${query.state.trim()}$`, "i");
    if (query.q) {
      filter.$or = [
        { first_name: new RegExp(query.q.trim(), "i") },
        { last_name:  new RegExp(query.q.trim(), "i") },
        { email:      new RegExp(query.q.trim(), "i") },
      ];
    }
    const options = {
      skip:  query.start  ? parseInt(query.start,  10) : 0,
      limit: query.limit  ? parseInt(query.limit,  10) : 20,
    };
    const { data, total } = await adminLawsService.paginateAdminUsers(filter, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  getAdminUserById = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const user = await adminLawsService.getUserById(req.params.id);
    if (!user) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
        data: {},
      };
    }
    const categories = await adminLawsService.getUserCategories(req.params.id);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data: { ...user, categories },
    };
  };

  toggleUserStatus = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: "status must be active or inactive",
        data: {},
      };
    }
    const updated = await adminLawsService.toggleUserStatus(req.params.id, status);
    if (!updated) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
        data: {},
      };
    }
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: status === "active" ? CUSTOM_MESSAGES.USER_ACTIVE : CUSTOM_MESSAGES.USER_INACTIVE,
      data: updated,
    };
  };

  listIngestionJobs = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const { query } = req;
    const filter = {};
    if (query.status) {
      filter.status = query.status.trim().toLowerCase();
    }
    const options = {
      skip: query.start ? parseInt(query.start, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };
    const { data, total } = await adminLawsService.paginateIngestionJobs(filter, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  listIngestionErrors = async (req) => {
    if (!this.isAdmin(req)) {
      return this.unauthorizedResponse();
    }
    const options = {
      skip: req.query.start ? parseInt(req.query.start, 10) : 0,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    };
    const { data, total } = await adminLawsService.paginateIngestionErrors(req.params.job_id, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  // ── Raise-a-Law moderation queue ──────────────────────────────────────────
  /* GET /admin/laws/suggestions?status=submitted&type=error&q=&start=&limit= */
  listSuggestions = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const { query } = req;
    const filter = {};
    if (query.status) filter.status = query.status.trim();
    if (query.type)   filter.type   = query.type.trim();
    if (query.state_code) filter.state_code = query.state_code.trim().toUpperCase();
    if (query.q) {
      const rx = new RegExp(query.q.trim(), "i");
      filter.$or = [{ title: rx }, { description: rx }];
    }
    const options = {
      skip: query.start ? parseInt(query.start, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };
    const { data, total } = await adminLawsService.paginateSuggestions(filter, options);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
      data,
      recordsTotal: total,
      recordsFiltered: total,
    };
  };

  /* PUT /admin/laws/suggestions/:id/status  { status, admin_note } */
  resolveSuggestion = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const { status, admin_note } = req.body;
    const allowed = ["submitted", "reviewing", "accepted", "rejected", "duplicate", "published"];
    if (!allowed.includes(status)) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: "Invalid status",
        data: {},
      };
    }
    const existing = await adminLawsService.getSuggestionById(req.params.id);
    if (!existing) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    const isResolved = ["accepted", "rejected", "duplicate", "published"].includes(status);
    const payload = {
      status,
      admin_note: admin_note || existing.admin_note || "",
      ...(isResolved ? { resolved_by: req.user.data._id, resolved_at: new Date() } : {}),
    };
    const updated = await adminLawsService.updateSuggestion(req.params.id, payload);

    // Notify the submitter whenever the status actually changes.
    if (existing.status !== status) {
      const populated = await adminLawsService.getSuggestionById(req.params.id);
      this._notifyOnStatusChange(populated, status, admin_note).catch(console.error);
    }
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_UPDATE_SUCCESS,
      data: updated,
    };
  };

  /* POST /admin/laws/suggestions/:id/convert — create a DRAFT StateLaw from it */
  convertSuggestionToDraft = async (req) => {
    if (!this.isAdmin(req)) return this.unauthorizedResponse();
    const suggestion = await adminLawsService.getSuggestionById(req.params.id);
    if (!suggestion) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: CUSTOM_MESSAGES.LAW_NOT_FOUND,
        data: {},
      };
    }
    // Allow admin overrides in the request body; otherwise seed from the suggestion.
    const body = req.body || {};
    const state_code = (body.state_code || suggestion.state_code || "").trim().toUpperCase();
    const law_key = (body.law_key || suggestion.law_key || "").trim().toLowerCase();
    if (!state_code || !law_key) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        message: "state_code and law_key are required to create a draft law",
        data: {},
      };
    }
    const latest = await adminLawsService.getLatestStateLaw(state_code, law_key);
    const summary = body.summary || suggestion.description || "";
    const payload = {
      state_code,
      law_key,
      title: body.title || suggestion.title || "",
      summary,
      details: body.details || "",
      official_url: suggestion.source_url || "",
      status: "draft",
      version: latest ? latest.version + 1 : 1,
      legality: classifyLegality(law_key, summary),
      created_by: req.user.data._id,
      updated_by: req.user.data._id,
      change_source: "manual",
    };
    const created = await adminLawsService.createStateLaw(payload);
    await adminLawsService.createAuditLog({
      entity_type: "state_laws",
      entity_id: created._id,
      action: "create",
      changed_fields: Object.keys(payload),
      after_data: created.toObject(),
      changed_by: req.user.data._id,
      source: "raise_a_law",
    });
    // Link the suggestion → draft, mark accepted, and tell the submitter.
    await adminLawsService.updateSuggestion(suggestion._id, {
      status: "accepted",
      linked_law_id: created._id.toString(),
      resolved_by: req.user.data._id,
      resolved_at: new Date(),
    });
    const populated = await adminLawsService.getSuggestionById(suggestion._id);
    this._notifyOnStatusChange(populated, "accepted", body.admin_note).catch(console.error);

    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.LAW_ADDED_SUCCESS,
      data: created,
    };
  };

  /* Compose a submitter-friendly notification for a suggestion status change. */
  _notifyOnStatusChange = (suggestion, status, adminNote) => {
    const stateName = suggestion.state_code
      ? (STATE_NAME_BY_CODE[suggestion.state_code] || suggestion.state_code)
      : "";
    const subject = suggestion.title
      ? `"${suggestion.title}"`
      : (stateName ? `your ${stateName} suggestion` : "your suggestion");
    let title;
    let body;
    switch (status) {
      case "reviewing":
        title = "Suggestion under review";
        body = `We're reviewing ${subject}. We'll let you know when there's an update.`;
        break;
      case "accepted":
        title = "Suggestion accepted";
        body = `Thanks! ${subject} was accepted and is being added to our law data.`;
        break;
      case "published":
        title = "Suggestion published";
        body = `Great news — ${subject} is now live in our law data.`;
        break;
      case "duplicate":
        title = "Already on our radar";
        body = `${subject} is already tracked — thanks for helping keep things accurate.`;
        break;
      case "rejected":
        title = "Suggestion not accepted";
        body = `We reviewed ${subject} and won't be adding it at this time.${
          adminNote ? ` Note: ${adminNote}` : ""
        }`;
        break;
      case "submitted":
        title = "Suggestion received";
        body = `${subject} is in our review queue.`;
        break;
      default:
        title = "Suggestion status updated";
        body = `The status of ${subject} is now "${status}".${
          adminNote ? ` Note: ${adminNote}` : ""
        }`;
        break;
    }
    return adminLawsService.notifySubmitter(suggestion, {
      title,
      body,
      status,
      deepLink: { route: "/notifications", args: {} },
    });
  };
}

export default AdminLawsController;
