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
import User from "../../database/models/User";
import firebaseService from "../services/common/firebase";

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

  notifyAffectedUsers = async (law, action, adminId) => {
    // Map admin action → Flutter NotifType enum value + change_type string
    const typeMap       = { publish: 'lawNew',    update: 'lawUpdate', repeal: 'lawRepeal' };
    const changeTypeMap = { publish: 'published', update: 'updated',   repeal: 'repealed'  };

    const notifType  = typeMap[action]       || 'lawUpdate';
    const changeType = changeTypeMap[action] || 'updated';
    const actionText = { publish: 'published', update: 'updated', repeal: 'repealed' }[action] || 'changed';

    const title   = `${law.title} ${actionText}`;
    const body    = `"${law.title}" has been ${actionText} in ${law.state_code}.`;

    // Find all active user categories matching this law's state (and city if set)
    const categoryFilter = { state: law.state_code, active: true };
    if (law.city) categoryFilter.city = new RegExp(`^${law.city}$`, "i");

    const affectedCategories = await UserCategoryLaws.find(categoryFilter);
    if (!affectedCategories.length) return;

    // Deduplicate user IDs
    const userIds = [...new Set(affectedCategories.map((c) => c.user_id.toString()))];

    // Fetch each user's home state
    const users = await User.find({ _id: { $in: userIds } }).select('state').lean();
    const homeStateMap = {};
    users.forEach((u) => { homeStateMap[u._id.toString()] = u.state || ''; });

    // Build device token map per user for individual FCM sends
    const devices = await Device.find({ user_id: { $in: userIds }, is_deleted: false }).lean();
    const deviceMap = {};
    devices.forEach((d) => {
      const uid = d.user_id.toString();
      if (!deviceMap[uid]) deviceMap[uid] = [];
      deviceMap[uid].push(d.device_token);
    });

    // Send individual FCM per user so each gets their own home_state in the payload
    await Promise.allSettled(
      userIds.map((userId) => {
        const tokens = deviceMap[userId];
        if (!tokens || !tokens.length) return Promise.resolve();
        return firebaseService.sendNotification({
          registrationToken: tokens,
          title,
          message: body,
          payload: {
            type:          notifType,
            current_state: law.state_code,
            home_state:    homeStateMap[userId],
            law_title:     law.title,
            law_key:       law.law_key || '',
            change_type:   changeType,
          },
        });
      })
    );

    // Persist a notification record per affected user with all navigation fields
    const notificationDocs = userIds.map((userId) => ({
      title,
      body,
      message: body,           // backward-compat alias
      type:          notifType,
      sender_id:     adminId,
      receiver_id:   userId,
      is_read:       false,
      current_state: law.state_code,
      home_state:    homeStateMap[userId],
      law_title:     law.title,
      law_key:       law.law_key || '',
      change_type:   changeType,
      created_at:    new Date(),
    }));
    await Notification.insertMany(notificationDocs);
  };
}

export default new AdminLawsService();
