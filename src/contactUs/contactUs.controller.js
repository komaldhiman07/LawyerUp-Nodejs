import bcrypt from 'bcrypt';
import { matchedData } from 'express-validator';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

import contactUsService from './contactUs.service.js';
import twilioService from '../services/common/twilio.js';
import {
  RESPONSE_CODES,
  TWO_FACTOR_AUTH_TYPE,
  DEFAULT,
} from '../../config/constants.js';
import { CUSTOM_MESSAGES } from '../../config/customMessages.js';
import { sendEmail } from '../../src/helpers/email_service/email.js';
import { authObj } from '../services/common/object.service.js';
import firebase from '../services/common/firebase.js';
import emailService from '../services/common/email.js';

const _ = require('lodash');

class ContactUsController {
  constructor() { }

  /* contact us */
  contactUs = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const getUser = await contactUsService.getUser({ _id: user.data._id });
      if (!getUser) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.USER_NOT_FOUND,
          data: {},
        };
      }
      data.user_id = getUser._id;
      await contactUsService.addContactUs(data);
      let emailData = [{
        email: getUser.email,
      }]
      await sendEmail("signup", emailData);
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
