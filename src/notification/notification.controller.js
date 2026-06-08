import { RESPONSE_CODES } from "../../config/constants";
import notificationService from "./notification.service";

class NotificationController {
  /**
   * GET /notification/list
   * Returns all notifications for the authenticated user, newest first.
   */
  list = async (req, res) => {
    try {
      const userId = req.user.data._id;
      const notifications = await notificationService.getByUser(userId);
      return res.status(RESPONSE_CODES.GET).json({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications,
      });
    } catch (err) {
      console.error("[NotificationController.list]", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };

  /**
   * PATCH /notification/:id/read
   * Marks a single notification as read. Validates ownership.
   */
  markAsRead = async (req, res) => {
    try {
      const userId = req.user.data._id.toString();
      const { id } = req.params;

      const notification = await notificationService.getById(id);
      if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
      }
      if (notification.receiver_id.toString() !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      await notificationService.markAsRead(id);
      return res.status(RESPONSE_CODES.GET).json({
        success: true,
        message: "Notification marked as read",
      });
    } catch (err) {
      console.error("[NotificationController.markAsRead]", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };

  /**
   * PATCH /notification/read-all
   * Marks all of the authenticated user's notifications as read.
   */
  markAllAsRead = async (req, res) => {
    try {
      const userId = req.user.data._id;
      await notificationService.markAllAsRead(userId);
      return res.status(RESPONSE_CODES.GET).json({
        success: true,
        message: "All notifications marked as read",
      });
    } catch (err) {
      console.error("[NotificationController.markAllAsRead]", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  };
}

export default new NotificationController();
