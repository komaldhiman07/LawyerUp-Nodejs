import { matchedData } from "express-validator";
import adminLawsService from "./adminLaws.service";
import { RESPONSE_CODES, ROLE_IDS } from "../../config/constants";
import { CUSTOM_MESSAGES } from "../../config/customMessages";

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
      adminLawsService.notifyAffectedUsers(updated, "update", req.user.data._id).catch(console.error);
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
}

export default AdminLawsController;
