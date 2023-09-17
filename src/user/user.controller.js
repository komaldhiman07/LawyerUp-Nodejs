import bcrypt from "bcrypt";
import { matchedData } from "express-validator";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

import userService from "./user.service.js";
import UploadDocument from "../services/common/uploadDocToS3";
// import twilioService from "../services/common/twilio.js";
import {
  RESPONSE_CODES,
  TWO_FACTOR_AUTH_TYPE,
  DEFAULT,
} from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
import { authObj } from "../services/common/object.service";
import firebase from "../services/common/firebase.js";
import emailService from "../services/common/email";

class UserController {
  constructor() {}

  validateOtp = async (req) => {
    const data = matchedData(req);
    const user = await userService.getUser({ _id: req.user.data._id });
    if (user) {
      if (user.otp === data.otp) {
        user.is_otp_verified = true;
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

  resendOtp = async (req) => {
    const user = await userService.getUser({ email: req.user.data.email });
    if (user) {
      const otp = this.generateOTP();
      user.otp = otp;
      await user.save();
      const message = `Please verify your OTP at ${otp}`;
      if (user.phone) {
        // await twilioService.sendMessage({
        //   message,
        //   to: user.phone,
        // });
      }
      if (user.email) {
        await emailService.sendMail({
          from: user.email,
          subject: `Verify OTP`,
          text: `<b>Hello ${user.first_name} ${user.last_name}</b><br /><b>OTP</b> : ${otp}<br /><br />Regards<br />Admin`,
        });
      }
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: { otp },
        message: CUSTOM_MESSAGES.SUCESS,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  getUser = async (req) => {
    const user = await userService.getUser({ email: req.user.data.email });
    return {
      status: 200,
      success: true,
      data: authObj(user),
      message: "User success",
    };
  };

  updateStatus = async (req) => {
    const data = matchedData(req);
    await userService.updateUser({ status: data.status }, req.params.id);
    return {
      status: 200,
      success: true,
      data: null,
      message: CUSTOM_MESSAGES.STATUS_UPDATED,
    };
  };

  updateProfile = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    let userNameExist = data.username
      ? await userService.getUser({ username: data.username })
      : null;
    if (userNameExist && req.user.data.username != userNameExist.username) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USERNAME_ALREADY_EXIST,
      };
    }

    // let userPhoneExist = data.phone
    //   ? await userService.getUser({ phone: data.phone })
    //   : null;
    // if (userPhoneExist && req.user.data.phone != userPhoneExist.phone) {
    //   return {
    //     status: RESPONSE_CODES.BAD_REQUEST,
    //     success: false,
    //     data: {},
    //     message: CUSTOM_MESSAGES.USER_PHONE_ALREADY_EXIST,
    //   };
    // }

    // const stripeUser = await userService.getUser({ _id: req.user.data._id });
    // if (req.user.data.social_key && req.user.data.role_id._id == '620ca6e733032d8eb3c3b239' && !stripeUser.stripe_customer_id) {
    //   const stripeCustomer = await createStripeCustomer(data)
    //   data.stripe_customer_id = stripeCustomer.id;
    // }
    // if (data.state_id && req.user.data.role_id._id == '620ca6da33032d8eb3c3b236' && !stripeUser.stripe_account_id) {
    //   if (req.user.data.social_key) {
    //     req.user.data.first_name = data.first_name ? data.first_name : null
    //     req.user.data.last_name = data.last_name ? data.last_name : null
    //   }
    //   const stripeAccount = await createStripeAccount(data, req.user.data)
    //   data.stripe_account_id = stripeAccount.id;
    // }
    if(user.data && user.data.profile_image) {
      let profilePicKey = user.data.profile_image.split(
        "https://lawyerupapp.s3.amazonaws.com/"
      )[1];
      if(profilePicKey){
        const deleteParam = {
          Bucket: process.env.AWS_BUCKET,
          Key: profilePicKey,
        };
        const result = await UploadDocument.deleteFileFromAWS(deleteParam);
      }

    }
    await userService.updateUser(data, req.user.data._id);
    const userData = await userService.getUser({ _id: req.user.data._id });

    if (userData) {
      const token = await this.createToken(authObj(userData));
      const result = authObj(userData);

      result["token"] = token;
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: result,
        message: CUSTOM_MESSAGES.PROFILE_UPDATE_SUCCESS,
        // token: {token}
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  generateOTP() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  createToken = async (data) => {
    const token = await jwt.sign({ data }, process.env.PRIVATE_JWT_SECRET, {
      expiresIn: "365d",
    });
    return `Bearer ${token}`;
  };

  getRoles = async () => {
    const roles = await userService.getRoles(
      { name: { $ne: "Admin" }, is_deleted: { $ne: true } },
      { options: "name" }
    );
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      data: roles,
      message: CUSTOM_MESSAGES.SUCESS,
    };
  };

  updatePassword = async (req) => {
    const data = matchedData(req);
    const user = await userService.getUser({ _id: req.user.data._id });
    if (user) {
      const authenticate = await bcrypt.compare(
        data.oldPassword,
        user.password
      );
      if (!authenticate) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.INCORRECT_OLD_PASSWORD,
        };
      }
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      user.password = hash;
      await user.save();
      const token = await jwt.sign(
        { data: user },
        process.env.PRIVATE_JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: { token },
        message: CUSTOM_MESSAGES.PASSWORD_SET,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  resetPassword = async (req) => {
    const data = matchedData(req);
    const user = await userService.getUser({ _id: data.user_id });
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(data.password, salt);
      user.password = hash;
      await user.save();
      const token = await jwt.sign(
        { data: user },
        process.env.PRIVATE_JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: { token },
        message: CUSTOM_MESSAGES.PASSWORD_SET,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  getClubs = async (req) => {
    const data = matchedData(req);
    let query = {
      role_id: { $eq: "620ca6f433032d8eb3c3b247" },
      is_deleted: false,
    };
    if (data.search) {
      query = {
        ...query,
        ...{ club_name: { $regex: data.search, $options: "i" } },
      };
    }
    if (data.categoryIds && data.categoryIds.length) {
      query = { ...query, ...{ talent: { $in: data.categoryIds } } };
    }
    const stateWiseQuery = {
      ...query,
      ...{ state_id: req.user.data.state_id._id },
    };
    const withoutStateQuery = {
      ...query,
      ...{ state_id: { $ne: req.user.data.state_id._id } },
    };
    const stateWiseclub = await userService.getUsers(stateWiseQuery);
    const withoutStateclub = await userService.getUsers(withoutStateQuery);
    const club = stateWiseclub.concat(withoutStateclub);
    // const club = await userService.getUsers(query);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      data: club,
      message: CUSTOM_MESSAGES.SUCESS,
    };
  };

  getUserList = async (req) => {
    const options = {};
    let query = {};
    let filter = {};
    const role_id = req.body.role_id ? req.body.role_id.trim() : "";
    const searchValue = req.body.search ? req.body.search.value.trim() : "";

    if (role_id && role_id == "620504e9f47dd88dfc51e183") {
      return {
        status: RESPONSE_CODES.POST,
        success: false,
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
        data: {},
        recordsTotal: 0,
        recordsFiltered: 0,
      };
    }
    if (req.body.start || req.body.length) {
      options.skip = req.body.start ? parseInt(req.body.start) : 0;
      options.limit = req.body.length ? parseInt(req.body.length) : 10;
      query.is_deleted = false;
    } else {
      query.is_deleted = false;
    }

    if (role_id && role_id != "620504e9f47dd88dfc51e183") {
      filter = {
        ...query,
        role_id: role_id,
      };
    } else {
      query.role_id = { $ne: "620504e9f47dd88dfc51e183" };
      filter = query;
    }

    if (searchValue && searchValue != "") {
      filter = {
        ...query,
        $or: [
          { first_name: new RegExp(`.*${searchValue}.*`, "igm") },
          { last_name: new RegExp(`.*${searchValue}.*`, "igm") },
          { email: new RegExp(`.*${searchValue}.*`, "igm") },
          { phone: new RegExp(`.*${searchValue}.*`, "igm") },
        ],
      };
    } else {
      filter = filter;
    }

    const users = await userService.getUserList(filter, options);
    const usersCount = await userService.getTotalUserNumber(filter);
    const userList = users.map((e) => authObj(e));

    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.USER_LIST,
      data: userList,
      recordsTotal: usersCount,
      recordsFiltered: usersCount,
    };
  };

  getUserById = async (req) => {
    const user = await userService.getUserById(req.params.id);
    if (user.length == 0) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
    const doc = { ...user[0] };
    if (doc._doc.other_club_name) {
      if (doc._doc.club && doc._doc.club.length) {
        doc._doc.club.push({ _id: null, name: doc._doc.other_club_name });
      } else {
        doc._doc.club = [{ _id: null, name: doc._doc.other_club_name }];
      }
    }
    if (user.length > 0) {
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: [authObj(user[0])],
        message: CUSTOM_MESSAGES.USER_DETAILS,
      };
    }
  };

  activeInactive = async (req) => {
    const user = await userService.activeInactiveUser(
      { _id: req.params.id, is_deleted: false },
      req.body.status
    );
    if (!user) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message:
        req.body.status == "Active"
          ? CUSTOM_MESSAGES.USER_ACTIVE
          : CUSTOM_MESSAGES.USER_INACTIVE,
      data: user,
    };
  };

  getExpertList = async (req) => {
    const queryObj = {
      role_id: "620ca6da33032d8eb3c3b236",
      is_deleted: false,
      chargesEnabled: [1, 3],
    };
    let options = {};
    let expertsList = [];
    if (req.user.data.talent && req.user.data.talent.length) {
      const talent = req.user.data.talent.map((e) => e._id);
      if (talent) {
        queryObj["talent"] = { $in: talent };
      }
    }
    /**Get Expert List for Club */
    if (
      req.user.data.role_id &&
      req.user.data.role_id._id == "620ca6f433032d8eb3c3b247"
    ) {
      delete queryObj["talent"];
      queryObj["club"] = req.user.data._id;
    }
    if (req.body.start && req.body.length) {
      options.skip = req.body.start ? parseInt(req.body.start) : 0;
      options.limit = req.body.length ? parseInt(req.body.length) : 10;
    }
    let clubWiseExpertList = [];
    let stateWiseExpertList = [];
    let withoutStateClubExpertList = [];
    if (req.user.data.club && req.user.data.club.length > 0) {
      const clubWiseQuery = {
        ...queryObj,
        ...{ ["club"]: req.user.data.club[0]._id },
      };
      clubWiseExpertList = await userService.getExpertList(
        clubWiseQuery,
        options
      );
      // clubWiseExpertList = clubWiseExpertList.map((e) => authObj(e))
    }
    const stateWiseQuery =
      req.user.data.club && req.user.data.club.length > 0
        ? {
            ...queryObj,
            ...{
              state_id: req.user.data.state_id._id,
              ["club"]: { $ne: req.user.data.club[0]._id },
            },
          }
        : { ...queryObj, ...{ state_id: req.user.data.state_id._id } };
    stateWiseExpertList = await userService.getExpertList(
      stateWiseQuery,
      options
    );
    // stateWiseExpertList = stateWiseExpertList.map((e) => authObj(e))

    const withoutStateClubQuery =
      req.user.data.club && req.user.data.club.length > 0
        ? {
            ...queryObj,
            ...{
              state_id: { $ne: req.user.data.state_id._id },
              ["club"]: { $ne: req.user.data.club[0]._id },
            },
          }
        : { ...queryObj, ...{ state_id: { $ne: req.user.data.state_id._id } } };
    withoutStateClubExpertList = await userService.getExpertList(
      withoutStateClubQuery,
      options
    );
    // withoutStateClubExpertList = withoutStateClubExpertList.map((e) => authObj(e))

    expertsList = clubWiseExpertList.concat(stateWiseExpertList);
    expertsList = expertsList.concat(withoutStateClubExpertList);
    // expertsList = await userService.getExpertList(queryObj, options);
    const expertsCount = await userService.getTotalExpertNumber(queryObj);
    if (expertsList && expertsList.length) {
      const expertsLists = expertsList.map((e) => authObj(e));
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.EXPERT_LIST,
        data: expertsLists,
        recordsTotal: expertsCount,
        recordsFiltered: expertsCount,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.EXPERT_NOT_FOUND,
    };
  };

  getPerformerList = async (req) => {
    const queryObj = {
      role_id: "620ca6e733032d8eb3c3b239",
      is_deleted: false,
    };
    let options = {};
    let performersList = [];
    /**Get Expert List for Club */
    if (
      req.user.data.role_id &&
      req.user.data.role_id._id == "620ca6f433032d8eb3c3b247"
    ) {
      delete queryObj["talent"];
      queryObj["club"] = req.user.data._id;
    }
    if (req.body.start && req.body.length) {
      options.skip = req.body.start ? parseInt(req.body.start) : 0;
      options.limit = req.body.length ? parseInt(req.body.length) : 10;
    }
    performersList = await userService.getPerformerList(queryObj, options);
    const expertsCount = await userService.getTotalPerformerNumber(queryObj);
    if (performersList && performersList.length) {
      const performersLists = performersList.map((e) => authObj(e));
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        message: CUSTOM_MESSAGES.Performer_LIST,
        data: performersLists,
        recordsTotal: expertsCount,
        recordsFiltered: expertsCount,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.Performer_NOT_FOUND,
    };
  };

  deleteUser = async (req) => {
    let is_deleted = true;
    const user = await userService.deleteUser(
      { _id: req.params.id, is_deleted: false },
      is_deleted
    );
    if (!user) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.USER_DELETE,
      data: user,
    };
  };

  updateUser = async (req) => {
    const data = matchedData(req);
    let userExist = await userService.getUserById(req.params.id);
    userExist = userExist.length > 0 ? userExist[0] : null;
    if (!userExist) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_NOT_FOUND,
      };
    }
    let userEmailExist = await userService.getUser({
      email: data.email,
      is_deleted: false,
    });
    if (userEmailExist && userExist.email != userEmailExist.email) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_EMAIL_ALREADY_EXIST,
      };
    }

    let userPhoneExist = data.phone
      ? await userService.getUser({ phone: data.phone })
      : null;
    if (userPhoneExist && userExist.phone != userPhoneExist.phone) {
      return {
        status: RESPONSE_CODES.BAD_REQUEST,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.USER_PHONE_ALREADY_EXIST,
      };
    }
    // if (data.other_club_name) {
    //   data.club = [];
    // }
    await userService.updateUser(data, req.params.id);
    const user = await userService.getUser({ _id: req.params.id });
    // const doc = { ...user };
    // if (doc._doc.other_club_name) {
    //   if (doc._doc.club && doc._doc.club.length) {
    //     doc._doc.club.push({ _id: null, name: doc._doc.other_club_name });
    //   } else {
    //     doc._doc.club = [{ _id: null, name: doc._doc.other_club_name }];
    //   }
    // }
    if (user) {
      return {
        status: RESPONSE_CODES.GET,
        success: true,
        data: authObj(user),
        message: CUSTOM_MESSAGES.PROFILE_UPDATE_SUCCESS,
      };
    }
    return {
      status: RESPONSE_CODES.BAD_REQUEST,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.USER_NOT_FOUND,
    };
  };

  async stripeReAuth(req, res) {
    let URL = process.env.WEB_URL_LANDING + "error";
    res.writeHead(301, { Location: URL });
    return res.end();
  }

  async stripeReturn(req, res) {
    const { query } = req;
    let URL;
    const user = await userService.getUserById(query.syncId);
    if (user) {
      URL = process.env.WEB_URL_LANDING + "thankyou";
      res.writeHead(301, { Location: URL });
      return res.end();
    } else {
      URL = process.env.WEB_URL_LANDING + "error";
      res.writeHead(301, { Location: URL });
      return res.end();
    }
  }

  contactUs = async (req) => {
    const { body } = req;
    await emailService.sendMail({
      from: process.env.PERMAXO_EMAIL,
      subject: `Contact US`,
      text: `<b>Name : ${body.name}</b><br /><b>Email</b> : ${body.email}<br /><br /><b>Message</b> : ${body.message}`,
    });
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.CONTACT_US,
      data: null,
    };
  };

  androidLead = async (req) => {
    const { body } = req;
    body.email = body.email.toLowerCase();
    body.created_at = new Date();
    body.updated_at = new Date();
    const isAndroidLead = await userService.getAndroidLeadByEmail(body.email);
    if (isAndroidLead) {
      return {
        status: RESPONSE_CODES.POST,
        success: false,
        message: CUSTOM_MESSAGES.USER_EMAIL_ALREADY_EXIST,
        data: null,
      };
    }
    await userService.createAndroidLead(body);
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.DELATILS_SAVE,
      data: null,
    };
  };

  androidLeadList = async (req) => {
    const { body } = req;
    const list = await userService.androidLeadList(body);
    const count = await userService.androidLeadTotalCount();
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.SUCESS,
      data: list,
      recordsTotal: count,
      recordsFiltered: count,
    };
  };

  addReview = async (req) => {
    const data = matchedData(req);
    data.created_at = new Date();
    data.performer_id = req.user.data._id;
    const result = await userService.addRating(data);
    if (result) {
      const userRatings = await userService.getRatings({
        expert_id: data.expert_id,
      });
      const ratings = userRatings.map((e) => e.rating);
      const average = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const avgRating = average(ratings).toFixed(2);
      const devices = await userService.getDevices({
        user_id: { $in: data.expert_id },
      });
      const deviceTokens = devices.map((e) => e.device_token);
      const firebaseObj = {
        registrationToken: deviceTokens,
        title: "Rating Received.",
        message: `${req.user.data.first_name} ${req.user.data.last_name} has rated you for the review.`,
      };
      const notificationObj = {
        title: firebaseObj.title,
        message: `${req.user.data.first_name} ${req.user.data.last_name} has rated you for the review.`,
        sender_id: req.user.data._id,
        receiver_id: data.expert_id,
        created_at: new Date(),
      };
      await userService.addNotification([notificationObj]);
      try {
        await firebase.sendNotification(firebaseObj);
      } catch (e) {
        console.log(e);
      }
      await userService.updateUser(
        { averageRating: avgRating },
        data.expert_id
      );
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.ADD_RATING,
        data: result,
      };
    }
    return {
      status: RESPONSE_CODES.POST,
      success: false,
      message: CUSTOM_MESSAGES.ADD_RATING_ERROR,
      data: null,
    };
  };

  getNotifications = async (req) => {
    const notificaions = await userService.getNotification(
      { receiver_id: req.user.data._id },
      [
        {
          path: "sender_id",
          select: "first_name last_name profile_image",
        },
      ]
    );
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      data: notificaions,
      message: CUSTOM_MESSAGES.NOTIFICATIONS_FOUND,
    };
  };

  getTransaction = async (req) => {
    let where = {};
    if (req.user.data.role_id._id === "620ca6da33032d8eb3c3b236") {
      where = { expert_id: req.user.data._id };
    } else {
      where = { performer_id: req.user.data._id };
    }
    const populate = [
      {
        path: "album_id",
        select: "name description",
      },
      {
        path: "expert_id",
        select: "first_name last_name profile_image",
      },
      {
        path: "performer_id",
        select: "first_name last_name profile_image",
      },
    ];
    const transaction = await userService.getTransaction(where, populate);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      data: transaction,
      message: CUSTOM_MESSAGES.TRANSACTION_FOUND,
    };
  };

  /* validate user password */
  validatePassword = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    try {
      const getUser = await userService.getUser({ _id: user.data._id });
      if (!getUser) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.USER_NOT_FOUND,
          data: {},
        };
      }
      const authenticate = await bcrypt.compare(
        data.password,
        getUser.password
      );
      if (!authenticate) {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          message: CUSTOM_MESSAGES.INVALID_CREDENTIALS,
          data: {},
        };
      }
      return {
        status: RESPONSE_CODES.POST,
        success: true,
        message: CUSTOM_MESSAGES.PASSWORD_VALIDATE_SUCCESS,
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

  /* two factor authorization */
  twoFactorAuth = async (req) => {
    const data = matchedData(req);
    const { user } = req;
    console.log("user: ", user);

    try {
      if (data.type === TWO_FACTOR_AUTH_TYPE.GENERATE) {
        const secretCodeRes = speakeasy.generateSecret({
          name: "lawyerUp",
          length: 10,
        });
        console.log("secretCodeRes :", secretCodeRes);
        const qr_code = await QRCode.toDataURL(secretCodeRes.otpauth_url);
        console.log("qr_code :", qr_code);

        const secret_code = secretCodeRes.base32;
        console.log("secret_code :", secret_code);

        console.log("User detail updated...");
        return {
          status: RESPONSE_CODES.POST,
          success: true,
          message: CUSTOM_MESSAGES.SUCESS,
          data: { secret_code, qr_code },
        };
      } else if (data.type === TWO_FACTOR_AUTH_TYPE.VERIFY) {
        console.log("user id : ", user.data._id);
        console.log("User body data : ", data);
        // const userDetail = await userService.getUser({ _id: user.data._id });

        if (data.secret_2fa && data.otp) {
          const verified = await speakeasy.totp.verify({
            secret: data.secret_2fa,
            encoding: "base32",
            token: data.otp,
          });
          if (verified) {
            await userService.updateUser(
              {
                enabled_2fa: DEFAULT.TRUE,
                secret_2fa: data.secret_code,
              },
              user.data._id
            );
          }
          console.log("verified :", verified);
          return {
            status: RESPONSE_CODES.POST,
            success: verified,
            message: verified
              ? CUSTOM_MESSAGES.TWO_FACTOR_VERIFICATION_SUCCESS
              : CUSTOM_MESSAGES.TWO_FACTOR_VERIFICATION_FAILED,
            data: {},
          };
        } else {
          return {
            status: RESPONSE_CODES.BAD_REQUEST,
            success: false,
            message: CUSTOM_MESSAGES.TWO_FACTOR_NOT_SETUP,
            data: {},
          };
        }
      } else {
        //Validate otp after login
        const userDetail = await userService.getUser({ _id: user.data._id });
        if (userDetail.secret_2fa && data.otp) {
          const validate = await speakeasy.totp.verify({
            secret: userDetail.secret_2fa,
            encoding: "base32",
            token: data.otp,
          });
          if (validate) {
            await userService.updateUser(
              {
                enabled_2fa: DEFAULT.TRUE,
                secret_2fa: data.secret_code,
              },
              user.data._id
            );
          }
          console.log("validate :", validate);
          return {
            status: RESPONSE_CODES.POST,
            success: validate,
            message: validate
              ? CUSTOM_MESSAGES.TWO_FACTOR_VELIDATE_SUCCESS
              : CUSTOM_MESSAGES.TWO_FACTOR_VELIDATE_FAILED,
            data: {},
          };
        }
      }
    } catch (error) {
      console.log("Catch error : ", error);
      return {
        status: RESPONSE_CODES.SERVER_ERROR,
        success: false,
        message: error.message,
        data: {},
      };
    }
  };
  /* end */
}

export default UserController;
