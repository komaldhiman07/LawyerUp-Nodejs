import bcrypt from "bcrypt";
import { matchedData } from "express-validator";
import jwt from "jsonwebtoken";
// import randomize from 'randomatic';

import authService from "./auth.service.js";
import settingService from "../settings/settings.service";
import { authObj } from "../services/common/object.service";
import emailService from "../services/common/email.js";
import { RESPONSE_CODES, DEFAULT } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";

// import {sendEmail} from "../helpers/email_service/email"
import { sendEmail } from "../helpers/email_service/email";
class AuthController {
  constructor() { }

  getUserByEmailOrUserName = async (emailOrUsername) => {
    const emailExpression =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isEmail = emailExpression.test(String(emailOrUsername).toLowerCase());
    let user = null;
    if (isEmail) {
      user = await authService.getUser({ email: emailOrUsername });
    } else {
      user = await authService.getUser({ username: emailOrUsername });
    }
    return { user, isEmail };
  }
  login = async (req) => {
    let retObj = {};
    const data = matchedData(req);
    let { user, isEmail } = await this.getUserByEmailOrUserName(data.emailOrUsername.toLowerCase());
    if (user) {
      if (isEmail && user.login_type !== "Manual") {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.SOCIAL_LOGIN_ERROR,
          data: {},
        };
      }
      const authenticate = await bcrypt.compare(data.password, user.password);
      if (!authenticate) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.INCORRECT_PASSWORD,
        };
      }

      const setting = await settingService.getSettings({ user_id: user._id })
      const is_enabled_2fa = setting ? setting.is_enabled_2fa : false;
      const token = await this.createToken(authObj({ ...user.toObject(), is_enabled_2fa }));
      if (!user.is_otp_verified) {
        retObj = {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: { token },
          message: CUSTOM_MESSAGES.VALIDATE_OTP,
        };
      } else {
        const device = await authService.getDevice({
          user_id: user._id,
          device_id: data.device_id,
        });
        const devicePayload = {
          device_id: data.device_id,
          device_type: data.device_type,
          device_token: data.device_token,
          user_id: user._id,
        };
        if (!device) {
          await authService.createDevice(devicePayload);
        } else {
          await authService.updateDevice({ user_id: user._id, device_id: data.device_id }, devicePayload)
        }
        // if (user.role_id._id == '620ca6e733032d8eb3c3b239' && !user.stripe_customer_id) {
        //   const stripeCustomer = await createStripeCustomer(user)
        //   await authService.updateUser({ _id: user._id }, { stripe_customer_id: stripeCustomer.id });
        // }
        // if (user.role_id._id == '620ca6da33032d8eb3c3b236' && !user.stripe_account_id) {
        //   const stripeAccount = await createStripeAccount(user, user)
        //   await authService.updateUser({ _id: user._id }, { stripe_account_id: stripeAccount.id });
        // }
        retObj = {
          status: RESPONSE_CODES.POST,
          success: true,
          data: { token },
          message: CUSTOM_MESSAGES.LOGIN_SUCCESS,
        };
      }
    } else {
      retObj = {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
    return retObj;
  };

  create = async (req) => {
    try {
      let retObj = {};
      const data = matchedData(req);
      let userEmailExist = data.email
        ? await authService.getUser({ email: data.email.toLowerCase() })
        : null;
      if (userEmailExist) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.USER_EMAIL_ALREADY_EXIST,
        };
      }
      // let userPhoneExist = data.phone
      //   ? await authService.getUser({ phone: data.phone })
      //   : null;
      // if (userPhoneExist) {
      //   return {
      //     status: RESPONSE_CODES.BAD_REQUEST,
      //     success: false,
      //     data: {},
      //     message: CUSTOM_MESSAGES.USER_PHONE_ALREADY_EXIST,
      //   };
      // }
      const role = await authService.getRole({ _id: data.role_id });

      const salt = await bcrypt.genSalt(10);

      const hash = data.password ? await bcrypt.hash(data.password, salt) : null;

      const otp = this.generateOTP();

      let userData = {
        ...data, password: hash, otp, is_otp_verified: true,
        secret_2fa: ""
      };
      if (role.name === "Admin" || data.device_type == 'web') {
        userData = { ...userData, is_otp_verified: true };
      }
      let password = null
      if (data.device_type == 'web') {
        password =  "fhsdfga";//randomize('*', 10);
        userData.password = bcrypt.hashSync(password, salt);
      }
      /** create stripe customer for Performer */
      // if (userData.role_id == '620ca6e733032d8eb3c3b239') {
      //   const stripeCustomer = await createStripeCustomer(userData)
      //   userData.stripe_customer_id = stripeCustomer.id;
      // }
      // /** create stripe connect account for Expert */
      // if (userData.role_id == '620ca6da33032d8eb3c3b236') {
      //   const stripeAccount = await createStripeAccount(userData)
      //   userData.stripe_account_id = stripeAccount.id;
      // }
      /** create user */
      userData.email = userData.email.toLowerCase()
      userData.username = userData.username.toLowerCase()
      const user = await authService.createUser(userData);
      if (user) {
        const userToken = await authService.getUser({ email: data.email });

        const device = {
          device_id: data.device_id,
          device_type: data.device_type,
          device_token: data.device_token,
          user_id: user._doc._id,
        };
        await authService.createDevice(device);
        const token = await this.createToken(authObj(userToken));
        retObj = {
          status: RESPONSE_CODES.POST,
          success: true,
          data: { token },
          // data: { otp, token },
          message: CUSTOM_MESSAGES.USER_REGISTER_SUCCESS,
        };
        let emailData = [{
          email: user.email,
          otp,
          name: `${user.first_name} ${user.last_name}`
        }]
        sendEmail("signup", emailData);
        // Save default setting for user
        const defaultSettingObj = {
          user_id: user._doc._id,
          // notifications: {
          //   push: DEFAULT.TRUE,
          //   email: DEFAULT.TRUE,
          //   sound: DEFAULT.TRUE
          // },
          // theme: THEME.LIGHT,
          notifications: DEFAULT.TRUE,
          is_enabled_2fa: DEFAULT.FALSE
        }
        settingService.createSettings(defaultSettingObj);
      } else {
        retObj = {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.ADD_USER_ERROR,
        };
      }
      return retObj;
    } catch (error) {
      console.log("error catch: ", error);
    }
  };

  socialLogin = async (req) => {
    const data = matchedData(req);
    const userExist = await authService.getUser({
      social_key: data.social_key,
    });
    if (userExist) {
      const token = await this.createToken(authObj(userExist));
      const device = await authService.getDevice({
        user_id: userExist._id,
        device_id: data.device_id,
      });
      if (!device) {
        const device = {
          device_id: data.device_id,
          device_type: data.device_type,
          device_token: data.device_token,
          user_id: userExist._id,
        };
        await authService.createDevice(device);
      }
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        data: { token },
        message: CUSTOM_MESSAGES.LOGIN_SUCCESS,
      };
    }
    return {
      status: 200,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  socialSignUp = async (req) => {
    let retObj = {};
    const data = matchedData(req);
    const userExist = await authService.getUser({
      social_key: data.social_key,
    });
    if (userExist) {
      const token = await this.createToken(authObj(userExist));
      const device = await authService.getDevice({
        user_id: userExist._id,
        device_id: data.device_id,
      });
      if (!device) {
        const device = {
          device_id: data.device_id,
          device_type: data.device_type,
          device_token: data.device_token,
          user_id: userExist._id,
        };
        await authService.createDevice(device);
      }
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        data: { token },
        message: CUSTOM_MESSAGES.LOGIN_SUCCESS,
      };
    }
    if (data.email) {
      const userExist = await authService.getUser({ email: data.email });
      if (userExist) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.USER_EMAIL_ALREADY_EXIST,
        };
      }
    }
    if (data.phone) {
      const userExist = await authService.getUser({ phone: data.phone });
      if (userExist) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.USER_PHONE_ALREADY_EXIST,
        };
      }
    }
    const userData = { ...data, is_otp_verified: true };
    const user = await authService.createUser(userData);

    if (user) {
      const userToken = await authService.getUser({ _id: user._doc._id });
      const token = await this.createToken(authObj(userToken));
      const device = {
        device_id: data.device_id,
        device_type: data.device_type,
        device_token: data.device_token,
        user_id: user._doc._id,
      };
      await authService.createDevice(device);
      retObj = {
        status: RESPONSE_CODES.POST,
        success: true,
        data: { token },
        message: CUSTOM_MESSAGES.USER_REGISTER_SUCCESS,
      };
    } else {
      retObj = {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.ADD_USER_ERROR,
      };
    }
    return retObj;
  };

  getUser = async (req) => {
    const user = await authService.getUser({ email: "kalyani@softredix.com" });
    return {
      status: 200,
      success: true,
      data: user,
      message: "User success",
    };
  };

  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
  }
  validateOtp = async (req) => {
    const data = matchedData(req);
    const { user } = await this.getUserByEmailOrUserName(data.emailOrUsername.toLowerCase());
    if (user) {
      if (user.otp === data.otp) {
        user.is_otp_verified = true;
        user.otp = "";
        await user.save();
        return {
          status: RESPONSE_CODES.POST,
          success: true,
          data: {},
          message: CUSTOM_MESSAGES.OTP_VALIDATE_SUCCESS,
        };
      } else {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.OTP_VALIDATE_FAILURE,
        };
      }
    } else {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
  };
  forgotPassword = async (req) => {
    const data = matchedData(req);
    const emailExpression =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isEmail = emailExpression.test(String(data.emailOrUsername).toLowerCase());
    let user = null;
    if (isEmail) {
      user = await authService.getUser({ email: data.emailOrUsername.toLowerCase() });
    } else {
      user = await authService.getUser({ username: data.emailOrUsername.toLowerCase() });
    }
    if (user) {
      const otp = this.generateOTP();
      user.otp = otp;
      // const token = await this.createToken(authObj(user));
      await user.save();
      let emailData = [{
        email: user.email,
        otp,
        name: `${user.first_name} ${user.last_name}`
      }]
      sendEmail("forgot_password", emailData);

      // if (isEmail) {
      //   await emailService.sendMail({
      //     from: data.emailOrUsername,
      //     subject: `Forgot Password`,
      //     text: `<b>Hello ${user.first_name} ${user.last_name}</b><br />We have recieved a request from you to set password, please use below otp and set your password. <br /><b>OTP</b> : ${otp} <br /><br />Regards<br />LawyerUp Team`,
      //   });
      // } else {
      //   const message = `Please verify your OTP at ${otp}`;
      //   await twilioService.sendMessage({
      //     message,
      //     to: user.email,
      //   });
      // }
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        data: { otp },
        message: CUSTOM_MESSAGES.OTP_SUCCESS,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };
  resendOtp = async (req) => {
    const data = matchedData(req);
    const { user } = await this.getUserByEmailOrUserName(data.emailOrUsername.toLowerCase());
    if (user) {
      const otp = this.generateOTP();
      user.otp = otp;
      await user.save();
      // const message = `Please verify your OTP at ${otp}`;
      // if (user.phone) {
      //   await twilioService.sendMessage({
      //     message,
      //     to: user.phone,
      //   });
      // }
      if (user.email) {
        await emailService.sendMail({
          from: user.email,
          subject: `Forgot Password`,
          text: `<b>Hello ${user.first_name} ${user.last_name}</b><br />We have received a request from you to set password, please use below otp and set your password. <br /><b>OTP</b> : ${otp} <br /><br />Regards<br />LawyerUp Team`,
        });
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: { otp },
        message: CUSTOM_MESSAGES.SUCCESS,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };
  setNewPassword = async (req) => {
    const data = matchedData(req);
    const { user } = await this.getUserByEmailOrUserName(data.emailOrUsername.toLowerCase());
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hash = data.password ? await bcrypt.hash(data.password, salt) : null;
      user.password = hash;
      await user.save();
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        data: {},
        message: CUSTOM_MESSAGES.PASSWORD_SET,
      };

    } else {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
  }
  createToken = async (data) => {
    const token = await jwt.sign({ data }, process.env.PRIVATE_JWT_SECRET, {
      expiresIn: "365d",
    });
    return `Bearer ${token}`;
  };

  logout = async (req) => {
    const data = matchedData(req);
    await authService.deleteDevice({
      device_token: data.device_token,
      user_id: req.user.data._id,
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      data: {},
      message: CUSTOM_MESSAGES.USER_LOGGED_OUT,
    };
  };
}

export default AuthController;
