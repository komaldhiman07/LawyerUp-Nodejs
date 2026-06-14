import mongoose from "mongoose";
import { ROLE_IDS } from "../../config/constants";
import LawMaster from "../../database/models/LawMaster";
import StateLaw from "../../database/models/StateLaw";
import LawIngestionJob from "../../database/models/LawIngestionJob";
import LawIngestionError from "../../database/models/LawIngestionError";
import LawAuditLog from "../../database/models/LawAuditLog";
import UserCategoryLaws from "../../database/models/userCategoryLaws";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import RaisedLaws from "../../database/models/RaisedLaws";
import User from "../../database/models/User";
import firebaseService from "../services/common/firebase";
import { stateMatchers, STATE_NAME_BY_CODE } from "../helpers/usStates";

class AdminLawsService {
  getLawMaster = (filter) => LawMaster.findOne(filter);

  // P-08: Single $facet aggregation replaces separate find + countDocuments round-trips
  paginateLawMaster = async (filter, options) => {
    const [result] = await LawMaster.aggregate([
      { $match: filter },
      { $facet: {
        data:  [{ $sort: { updatedAt: -1 } }, { $skip: options.skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      }},
    ]);
    return { data: (result && result.data) || [], total: (result && result.total && result.total[0] && result.total[0].count) || 0 };
  };

  createLawMaster = (payload) => LawMaster.create(payload);

  updateLawMaster = (id, payload) =>
    LawMaster.findOneAndUpdate({ _id: id }, payload, { new: true });

  // P-08: Single $facet aggregation replaces separate find + countDocuments round-trips
  paginateStateLaws = async (filter, options) => {
    const [result] = await StateLaw.aggregate([
      { $match: filter },
      { $facet: {
        data:  [{ $sort: { updatedAt: -1 } }, { $skip: options.skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      }},
    ]);
    return { data: (result && result.data) || [], total: (result && result.total && result.total[0] && result.total[0].count) || 0 };
  };

  getStateLawById = (id) => StateLaw.findById(id);

  getLatestStateLaw = (state_code, law_key) =>
    StateLaw.findOne({ state_code, law_key, is_deleted: false }).sort({
      version: -1,
    });

  createStateLaw = (payload) => StateLaw.create(payload);

  updateStateLaw = (id, payload) =>
    StateLaw.findOneAndUpdate({ _id: id, is_deleted: false }, payload, {
      new: true,
    });

  createAuditLog = (payload) => LawAuditLog.create(payload);

  // P-08: Single $facet aggregation replaces separate find + countDocuments round-trips
  paginateIngestionJobs = async (filter, options) => {
    const [result] = await LawIngestionJob.aggregate([
      { $match: filter },
      { $facet: {
        data:  [{ $sort: { createdAt: -1 } }, { $skip: options.skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      }},
    ]);
    return { data: (result && result.data) || [], total: (result && result.total && result.total[0] && result.total[0].count) || 0 };
  };

  // P-08: job_id is a String field — no ObjectId cast needed
  paginateIngestionErrors = async (job_id, options) => {
    const [result] = await LawIngestionError.aggregate([
      { $match: { job_id } },
      { $facet: {
        data:  [{ $sort: { row_number: 1 } }, { $skip: options.skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      }},
    ]);
    return { data: (result && result.data) || [], total: (result && result.total && result.total[0] && result.total[0].count) || 0 };
  };

  getDashboardStats = async () => {
    const now = new Date();
    const last7  = new Date(now - 7  * 24 * 60 * 60 * 1000);
    const last30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalLawMasters,
      stateLawsByStatus,
      notifications7d,
      notifications30d,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ is_deleted: false, role_id: { $ne: ROLE_IDS.ADMIN } }),
      LawMaster.countDocuments({ is_deleted: false }),
      StateLaw.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Notification.countDocuments({ created_at: { $gte: last7 } }),
      Notification.countDocuments({ created_at: { $gte: last30 } }),
      LawAuditLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("changed_by", "first_name last_name email")
        .lean(),
    ]);

    const statusMap = { draft: 0, active: 0, repealed: 0 };
    stateLawsByStatus.forEach(({ _id, count }) => { if (_id) statusMap[_id] = count; });

    return {
      totalUsers,
      totalLawMasters,
      stateLaws: {
        draft:    statusMap.draft,
        active:   statusMap.active,
        repealed: statusMap.repealed,
        total:    statusMap.draft + statusMap.active + statusMap.repealed,
      },
      notifications: { last7d: notifications7d, last30d: notifications30d },
      recentActivity,
    };
  };

  // P-08: Single $facet aggregation replaces find + countDocuments.
  // Aggregation pipelines don't auto-cast types, so role_id.$ne must be an ObjectId.
  paginateAdminUsers = async (filter, options) => {
    const aggFilter = { ...filter };
    if (aggFilter.role_id && aggFilter.role_id.$ne && typeof aggFilter.role_id.$ne === 'string') {
      aggFilter.role_id = { $ne: new mongoose.Types.ObjectId(aggFilter.role_id.$ne) };
    }
    const [result] = await User.aggregate([
      { $match: aggFilter },
      { $project: { first_name: 1, last_name: 1, email: 1, state: 1, city: 1, status: 1, createdAt: 1, is_deleted: 1, role_id: 1 } },
      { $facet: {
        data:  [{ $sort: { createdAt: -1 } }, { $skip: options.skip }, { $limit: options.limit }],
        total: [{ $count: 'count' }],
      }},
    ]);
    return { data: (result && result.data) || [], total: (result && result.total && result.total[0] && result.total[0].count) || 0 };
  };

  getUserById = (id) =>
    User.findById(id)
      .select("first_name last_name email state city status createdAt is_deleted role_id")
      .lean();

  getUserCategories = (userId) =>
    UserCategoryLaws.find({ user_id: userId }).lean();

  toggleUserStatus = (id, status) =>
    User.findByIdAndUpdate(id, { status }, { new: true }).select("_id status").lean();

  // ── Raise-a-Law moderation queue ───────────────────────────────────────────
  paginateSuggestions = async (filter, options) => {
    const [data, total] = await Promise.all([
      RaisedLaws.find(filter)
        .populate({
          path: "user_id",
          model: User,
          select: ["first_name", "last_name", "email", "profile_image"],
        })
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      RaisedLaws.countDocuments(filter),
    ]);
    return { data, total };
  };

  getSuggestionById = (id) => RaisedLaws.findById(id);

  updateSuggestion = (id, payload) =>
    RaisedLaws.findByIdAndUpdate(id, payload, { new: true });

  /**
   * Tell the submitter their suggestion was acted on. Persist-first, then
   * best-effort push — mirrors notifyAffectedUsers so a push failure can never
   * lose the in-app record.
   */
  notifySubmitter = async (suggestion, { title, body, status, deepLink }) => {
    const rawUserId = suggestion.user_id && suggestion.user_id._id
      ? suggestion.user_id._id
      : suggestion.user_id;
    if (!rawUserId) {
      console.warn("[notifySubmitter] skipped — suggestion has no user_id");
      return;
    }
    const userId = mongoose.Types.ObjectId.isValid(rawUserId)
      ? new mongoose.Types.ObjectId(rawUserId.toString())
      : null;
    if (!userId) {
      console.warn("[notifySubmitter] skipped — invalid user_id");
      return;
    }

    const resolvedStatus = status || suggestion.status || "";
    const link = deepLink || { route: "/notifications", args: {} };
    const data = {
      suggestion_id: suggestion._id.toString(),
      status: resolvedStatus,
      suggestion_type: suggestion.type || "",
      title: suggestion.title || "",
    };

    const doc = {
      title,
      body,
      message: body,
      type: "suggestionUpdate",
      priority: "normal",
      receiver_id: userId,
      is_read: false,
      state_code: suggestion.state_code || "",
      law_key: suggestion.law_key || "",
      law_title: suggestion.title || "",
      cta_label: "View update",
      deep_link: link,
      data,
      created_at: new Date(),
    };
    try {
      await Notification.create(doc);
    } catch (e) {
      console.error("[notifySubmitter] create failed:", e && e.message);
    }
    try {
      const devices = await Device.find({ user_id: userId, is_deleted: false }).lean();
      const tokens = devices.map((d) => d.device_token).filter(Boolean);
      if (!tokens.length) {
        console.warn("[notifySubmitter] no device tokens for user", userId.toString());
        return;
      }
      await firebaseService.sendNotification({
        registrationToken: tokens,
        title,
        message: body,
        payload: {
          type: "suggestionUpdate",
          status: resolvedStatus,
          state_code: suggestion.state_code || "",
          law_key: suggestion.law_key || "",
          law_title: suggestion.title || "",
          cta_label: "View update",
          deep_link: JSON.stringify(link),
          data: JSON.stringify(data),
        },
      });
    } catch (e) {
      console.error("[notifySubmitter] push failed:", e && e.message);
    }
  };

  notifyAffectedUsers = async (law, action, adminId, context = {}) => {
    // Choose the most useful notification type for this change.
    const { penaltyBefore, penaltyAfter } = context;
    // Fires whenever the penalty text differs — including first-time additions.
    const penaltyChanged =
      action === 'update' &&
      String(penaltyBefore || '') !== String(penaltyAfter || '');
    const effDate = law.effective_from ? new Date(law.effective_from) : null;
    const isFutureEffective = effDate && effDate.getTime() > Date.now();
    // Full state name for human-readable display (records/nav still use the code).
    const stateName = STATE_NAME_BY_CODE[(law.state_code || '').toUpperCase()] || law.state_code;

    let notifType, changeType, priority, title, body;
    let data = {}, effectiveDate = null, expiresAt = null;

    if (penaltyChanged) {
      // Distinguish first-time add vs change vs removal for clearer wording.
      const had = String(penaltyBefore || '').trim().length > 0;
      const has = String(penaltyAfter || '').trim().length > 0;
      const verb = !had && has ? 'added' : (had && !has ? 'removed' : 'changed');
      notifType  = 'penaltyChange';
      changeType = 'updated';
      priority   = 'high';
      title = `Penalty ${verb}: ${law.title}`;
      body  = `The penalty for "${law.title}" in ${stateName} was ${verb}. Tap to review.`;
      data  = { from: penaltyBefore || '', to: penaltyAfter || '', change: verb };
    } else if (isFutureEffective && (action === 'publish' || action === 'update')) {
      notifType  = 'effectiveSoon';
      changeType = action === 'publish' ? 'published' : 'updated';
      priority   = 'normal';
      const dateStr = effDate.toISOString().slice(0, 10);
      title = `Takes effect ${dateStr}: ${law.title}`;
      body  = `"${law.title}" in ${stateName} takes effect on ${dateStr}.`;
      effectiveDate = effDate;
      expiresAt     = effDate;
    } else {
      const typeMap       = { publish: 'lawNew',    update: 'lawUpdate', repeal: 'lawRepeal' };
      const changeTypeMap = { publish: 'published', update: 'updated',   repeal: 'repealed'  };
      const actionText    = { publish: 'published', update: 'updated', repeal: 'repealed' }[action] || 'changed';
      notifType  = typeMap[action]       || 'lawUpdate';
      changeType = changeTypeMap[action] || 'updated';
      priority   = action === 'repeal' ? 'high' : 'normal';
      title = `${law.title} ${actionText}`;
      body  = `"${law.title}" has been ${actionText} in ${stateName}.`;
    }

    const deepLink = { route: 'stateLaws', args: { stateCode: law.state_code, lawKey: law.law_key || '' } };
    const ctaLabel = 'View law';

    // Find affected categories two ways (categories store state as a full name,
    // while law.state_code is a 2-letter code — match both):
    //  (a) old system: any active category in this law's state
    //  (b) new system: categories tracking THIS exact StateLaw (by law_id)
    const matchers = stateMatchers(law.state_code); // ['CA', 'California']
    const byStateFilter = { state: { $in: matchers }, active: true };
    if (law.city) byStateFilter.city = new RegExp(`^${law.city}$`, "i");

    const [byState, byTracking] = await Promise.all([
      UserCategoryLaws.find(byStateFilter),
      UserCategoryLaws.find({
        active: true,
        "state_laws.law_id": law._id.toString(),
      }),
    ]);

    // Merge + dedupe categories by _id
    const seen = new Set();
    const affectedCategories = [...byState, ...byTracking].filter((c) => {
      const id = c._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    if (!affectedCategories.length) return;

    // Deduplicate user IDs
    const userIds = [...new Set(affectedCategories.map((c) => c.user_id.toString()))];

    // Fetch each user's home state
    const users = await User.find({ _id: { $in: userIds } }).select('state').lean();
    const homeStateMap = {};
    users.forEach((u) => { homeStateMap[u._id.toString()] = u.state || ''; });

    // 1) PERSIST FIRST — the in-app record must be saved regardless of whether
    //    the push succeeds. (Previously FCM ran first and a push crash could
    //    abort the function before the insert ever happened.)
    const notificationDocs = userIds.map((userId) => ({
      title,
      body,
      message: body,           // backward-compat alias
      type:          notifType,
      priority,
      sender_id:     adminId,
      receiver_id:   userId,
      is_read:       false,
      current_state: law.state_code,
      home_state:    homeStateMap[userId],
      state_code:    law.state_code,
      law_title:     law.title,
      law_key:       law.law_key || '',
      change_type:   changeType,
      cta_label:     ctaLabel,
      deep_link:     deepLink,
      data,
      ...(effectiveDate ? { effective_date: effectiveDate } : {}),
      ...(expiresAt ? { expires_at: expiresAt } : {}),
      created_at:    new Date(),
    }));
    try {
      await Notification.insertMany(notificationDocs);
    } catch (e) {
      console.error('[notify] insertMany failed:', e && e.message);
    }

    // 2) THEN attempt push — best-effort, isolated from persistence.
    try {
      const devices = await Device.find({ user_id: { $in: userIds }, is_deleted: false }).lean();
      const deviceMap = {};
      devices.forEach((d) => {
        const uid = d.user_id.toString();
        if (!deviceMap[uid]) deviceMap[uid] = [];
        deviceMap[uid].push(d.device_token);
      });

      await Promise.allSettled(
        userIds.map((userId) => {
          const tokens = deviceMap[userId];
          if (!tokens || !tokens.length) return Promise.resolve();
          return firebaseService.sendNotification({
            registrationToken: tokens,
            title,
            message: body,
            payload: {
              // FCM data payload must be strings.
              type:          notifType,
              priority,
              current_state: law.state_code,
              home_state:    homeStateMap[userId],
              law_title:     law.title,
              law_key:       law.law_key || '',
              change_type:   changeType,
              cta_label:     ctaLabel,
              deep_link:     JSON.stringify(deepLink),
              data:          JSON.stringify(data),
              ...(effectiveDate ? { effective_date: effectiveDate.toISOString() } : {}),
            },
          });
        })
      );
    } catch (e) {
      console.error('[notify] push step failed (non-fatal):', e && e.message);
    }
  };
}

export default new AdminLawsService();
