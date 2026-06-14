import User from "../../database/models/User";
import Role from "../../database/models/Role";
import Country from "../../database/models/Country";
import State from "../../database/models/State";
import Language from "../../database/models/Language";
import Rating from "../../database/models/Rating";
import Device from "../../database/models/Device";
import Notification from "../../database/models/Notification";
import Transaction from "../../database/models/Transaction";
import ContactUs from "../../database/models/ContactUs";
import firebaseService from "../services/common/firebase";

class ContactUsService {
  constructor() {}

  getUser = (data) =>
    User.findOne(data).populate([
      {
        path: "role_id",
        model: Role,
        select: "name",
      },
      {
        path: "country_id",
        model: Country,
        select: "name",
      },
      // {
      //   path: "state_id",
      //   model: State,
      //   select: "name",
      // },
      {
        path: "language",
        model: Language,
        select: "name",
      },
    ]);

  addContactUs = (data) => ContactUs.create(data);

  paginateContactUs = async (filter, options) => {
    const [data, total] = await Promise.all([
      ContactUs.find(filter)
        .populate({
          path: "user_id",
          model: User,
          select: ["first_name", "last_name", "email", "profile_image"],
        })
        .sort({ createdAt: -1 })
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      ContactUs.countDocuments(filter),
    ]);
    return { data, total };
  };

  getContactUsById = (id) => ContactUs.findById(id);

  updateContactUs = (id, payload) =>
    ContactUs.findByIdAndUpdate(id, payload, { new: true });

  /**
   * Tell the user their contact request was resolved. Persist the in-app
   * notification first, then best-effort push (a push failure can never lose
   * the in-app record). Mirrors the suggestion-resolution flow.
   */
  notifyContactResolved = async (contact) => {
    const userId = contact.user_id && contact.user_id._id ? contact.user_id._id : contact.user_id;
    if (!userId) return;

    const title = "We’ve responded to your inquiry";
    const subject = contact.subject ? `“${contact.subject}”` : "your inquiry";
    const body = `Your request ${subject} (${contact.reference_number}) has been resolved — check your email for our reply.`;
    const deepLink = { route: "/ContactUsView", args: {} };

    const doc = {
      title,
      body,
      message: body,
      type: "contactReply",
      priority: "normal",
      receiver_id: userId,
      is_read: false,
      cta_label: "View",
      deep_link: deepLink,
      data: { contact_id: contact._id.toString(), reference_number: contact.reference_number || "" },
      created_at: new Date(),
    };
    try {
      await Notification.create(doc);
    } catch (e) {
      console.error("[notifyContactResolved] create failed:", e && e.message);
    }
    try {
      const devices = await Device.find({ user_id: userId, is_deleted: false }).lean();
      const tokens = devices.map((d) => d.device_token).filter(Boolean);
      if (tokens.length) {
        await firebaseService.sendNotification({
          registrationToken: tokens,
          title,
          message: body,
          payload: {
            type: "contactReply",
            deep_link: JSON.stringify(deepLink),
            data: JSON.stringify(doc.data),
          },
        });
      }
    } catch (e) {
      console.error("[notifyContactResolved] push failed:", e && e.message);
    }
  };

}

export default new ContactUsService();
