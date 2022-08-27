import jwt from "jsonwebtoken";
import { RESPONSE_CODES } from "../../config/constants";
import Logger from "./logger";
import User from "../../database/models/User";
import { CUSTOM_MESSAGES } from "../../config/customMessages";

const authMiddleWare = async (req, res, next) => {
  try {
    const logger = new Logger();
    await logger.init();
    const ignorePaths = [
      "/",
      "/api-docs",
      "/auth/sign-up",
      "/auth/social-login",
      "/auth/otp-verification",
      "/auth/resend-otp",
      "/auth/login",
      "/user/roles",
      "/auth/update-password",
      "/auth/forgot-password",
      "/auth/social-signup",
      "/user/upload-profile",
      "/user/reset-password",
      "/upload",
      "/admin/signup",
      "/categorySubcategory/",
      "/categorySubcategory/common-all",
      "/social-signup",
      "/video/status",
      "/user/stripe-integration/reauth",
      "/stripe/create-transfer",
      "/user/contact-us",
      "/user/android-lead",
      "/stripe/update-expert-stripe-status"
    ];
    const { method, headers, originalUrl } = req;

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const logObj = {
      ip,
      headers: req.headers,
      method: req.method,
      url: req.originalUrl,
      timestamp: Date.now(),
    };

    if (
      (method === "POST" && originalUrl === "/user") ||
      (method === "GET" && originalUrl.includes("?page=")) ||
      (method === "GET" && originalUrl.includes("/api-docs/")) ||
      (method === "PUT" && originalUrl.includes("/auth/reset-password/")) ||
      (method === "POST" && originalUrl.includes("/upload")) ||
      (method === "GET" && originalUrl.includes("/user/stripe-integration/return")) ||
      (method === 'PUT' && originalUrl.includes('/video/expired-album'))
    ) {
      logger.logInfo("Activity Log: ", logObj);
      // ignoring register URL
      return next();
    }

    const ignoreIndex = ignorePaths.findIndex((item) => item === originalUrl);
    if (ignoreIndex > -1) {
      logger.logInfo("Activity Log: ", logObj);
      return next();
    }

    if (!headers.authorization) {
      logger.logInfo("Activity Log: ", logObj);

      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.TOKEN_EXPIRED,
      });
    }
    const parts = req.headers.authorization.split(" ");
    let authorizationToken;
    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        authorizationToken = credentials;
        jwt.verify(
          authorizationToken,
          process.env.PRIVATE_JWT_SECRET,
          async (err, token) => {
            if (
              err
              // || !utils.authenticateHash(`${req.ip}${req.headers['user-agent']}${token._id}`, token.loc)
            ) {
              console.log("line no. 81 : err :", err);
              return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
                status: RESPONSE_CODES.UNAUTHORIZED,
                success: false,
                data: {},
                message: CUSTOM_MESSAGES.UNAUTHORIZED,
              });
            }
            const user = await User.findOne({ _id: token.data._id });
            token.data.phone = user.phone;
            token.data.email = user.email;
            token.data.talent = user.talent
            req.user = token;
            return validateUser(req, res, next);
          }
        );
      } else {
        console.log("line no. 95 : err :");
        return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
          status: RESPONSE_CODES.UNAUTHORIZED,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.UNAUTHORIZED,
        });
      }
    } else {
      console.log("line no. 105 : err :");
      return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      });
    }
  } catch (error) {
    console.log("line no. 114 : err :", error);
    return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
      status: RESPONSE_CODES.UNAUTHORIZED,
      success: false,
      data: {},
      message: CUSTOM_MESSAGES.UNAUTHORIZED,
    });
  }
};

const validateUser = async (req, res, next) => {
  const user = await User.findOne({ _id: req.user.data._id });
  if (user) {
    return next();
  }
  console.log("line no. 129 : err :");
  return res.status(RESPONSE_CODES.UNAUTHORIZED).json({
    status: RESPONSE_CODES.UNAUTHORIZED,
    success: false,
    data: {},
    message: CUSTOM_MESSAGES.UNAUTHORIZED,
  });
};

export default authMiddleWare;
