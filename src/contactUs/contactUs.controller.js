import { matchedData } from 'express-validator';
import contactUsService from './contactUs.service.js';
import {
  RESPONSE_CODES,
  ADMIN_EMAIL,
} from '../../config/constants.js';
import { CUSTOM_MESSAGES } from '../../config/customMessages.js';
import { sendEmail } from '../../src/helpers/email_service/email.js';
import randomstring from "randomstring";

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

}

export default ContactUsController;
