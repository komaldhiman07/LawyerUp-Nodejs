import { matchedData } from 'express-validator';
import contactUsService from './contactUs.service.js';
import {
  RESPONSE_CODES,
  ADMIN_EMAIL,
  ROLE_IDS,
} from '../../config/constants.js';
import { CUSTOM_MESSAGES } from '../../config/customMessages.js';
import { sendEmail } from '../../src/helpers/email_service/email.js';
import randomstring from "randomstring";

const ADMIN_ROLE_ID = ROLE_IDS.ADMIN;

function isAdmin(req) {
  const role = req && req.user && req.user.data ? req.user.data.role_id : null;
  if (!role) return false;
  if (typeof role === 'string') return role === ADMIN_ROLE_ID;
  if (role._id && role._id.toString() === ADMIN_ROLE_ID) return true;
  if (role.name && role.name.toLowerCase() === 'admin') return true;
  return false;
}

class ContactUsController {
  constructor() { }

  /* contact us */
  contactUs = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const userDetail = await contactUsService.getUser({ _id: user.data._id });
      if (!userDetail) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.USER_NOT_FOUND,
          data: {},
        };
      }
      data.user_id = userDetail._id;
      const reference_number = randomstring.generate({ length: 3, charset: 'alphabetic', capitalization: 'uppercase' }) + "-" + randomstring.generate({ length: 6, charset: 'numeric' }) + "-" + randomstring.generate({ length: 6, charset: 'alphabetic', capitalization: 'uppercase' });
      await contactUsService.addContactUs({...data, reference_number});
      let emailData = [{
        email: ADMIN_EMAIL,
        user_email: userDetail.email,
        reference_number,
        name: `${userDetail.first_name} ${userDetail.last_name}`,
        subject: data.subject,
        message: data.message,
      }]
      sendEmail("contact_us", emailData)
      .then((emailRes) => {
        console.log("emailResponse to Admin :" + JSON.stringify(emailRes));
      })
      .catch((e) => {
        console.log("Error sending email to admin :" + JSON.stringify(e));
      });
      // Auto Reply to sender
      const senderData = [
        {
          name: `${userDetail.first_name} ${userDetail.last_name}`,
          email: userDetail.email,
          reference_number,
          subject: "Contact Us Reply",
        },
      ];
      sendEmail("contact_us_reply", senderData)
        .then((emailRes) => {
          console.log("emailResponse to sender :" + JSON.stringify(emailRes));
        })
        .catch((e) => {
          console.log("Error sending email to user : " + JSON.stringify(e));
        });
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.REQUEST_SENT_SUCCESS,
        data: {},
      };
    } catch (error) {
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error,
        data: {},
      };
    }
  };
  /* end */

  /* GET /contact-us/admin/list?status=&q=&start=&limit= — admin inbox */
  adminList = async (req) => {
    if (!isAdmin(req)) {
      return { status: RESPONSE_CODES.UNAUTHORIZED, success: false, message: CUSTOM_MESSAGES.UNAUTHORIZED, data: [] };
    }
    const { query } = req;
    const filter = {};
    if (query.status) filter.status = query.status.trim();
    if (query.q) {
      const rx = new RegExp(query.q.trim(), 'i');
      filter.$or = [{ subject: rx }, { message: rx }, { reference_number: rx }];
    }
    const options = {
      skip: query.start ? parseInt(query.start, 10) : 0,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };
    try {
      const { data, total } = await contactUsService.paginateContactUs(filter, options);
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.DATA_LOADED_SUCCESS,
        data,
        recordsTotal: total,
        recordsFiltered: total,
      };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: [] };
    }
  };
  /* end */

  /* PUT /contact-us/:id/status — admin: { status, admin_note } */
  updateStatus = async (req) => {
    if (!isAdmin(req)) {
      return { status: RESPONSE_CODES.UNAUTHORIZED, success: false, message: CUSTOM_MESSAGES.UNAUTHORIZED, data: {} };
    }
    const { status, admin_note } = req.body;
    const allowed = ['pending', 'read', 'resolved'];
    if (!allowed.includes(status)) {
      return { status: RESPONSE_CODES.BAD_REQUEST, success: false, message: 'Invalid status', data: {} };
    }
    try {
      const existing = await contactUsService.getContactUsById(req.params.id);
      if (!existing) {
        return { status: RESPONSE_CODES.BAD_REQUEST, success: false, message: CUSTOM_MESSAGES.DATA_NOT_FOUND || 'Not found', data: {} };
      }
      const payload = { status };
      if (admin_note !== undefined) payload.admin_note = String(admin_note);
      if (status === 'resolved') {
        payload.resolved_by = req.user.data._id;
        payload.resolved_at = new Date();
      }
      const updated = await contactUsService.updateContactUs(req.params.id, payload);

      // Notify the user once — only on the transition into "resolved".
      if (status === 'resolved' && existing.status !== 'resolved') {
        contactUsService.notifyContactResolved(updated).catch((e) =>
          console.error('[contactUs.updateStatus] notify failed:', e && e.message)
        );
      }
      return { status: RESPONSE_CODES.POST, success: true, message: CUSTOM_MESSAGES.DATA_UPDATED_SUCCESS || 'Updated', data: updated };
    } catch (error) {
      return { status: RESPONSE_CODES.SERVER_ERROR, success: false, message: error, data: {} };
    }
  };
  /* end */

}

export default ContactUsController;
