import Notification from "../../database/models/Notification";

class NotificationService {
  /**
   * Get all notifications for a user, newest first.
   */
  getByUser = (userId) =>
    Notification.find({ receiver_id: userId })
      .sort({ created_at: -1 })
      .lean();

  /**
   * Find a single notification by _id.
   */
  getById = (id) => Notification.findById(id).lean();

  /**
   * Mark a single notification as read. Returns null if not found.
   */
  markAsRead = (id) =>
    Notification.findByIdAndUpdate(id, { is_read: true }, { new: true }).lean();

  /**
   * Mark all notifications for a user as read.
   */
  markAllAsRead = (userId) =>
    Notification.updateMany({ receiver_id: userId, is_read: false }, { is_read: true });
}

export default new NotificationService();
