import express from "express";
import { checkSchema } from "express-validator";
import multer from "multer";
import path from "path";

import { authenticate } from "../../authenticate.handler.js";
import UserController from "./user.controller.js";
import Validator from "./user.validation.js";
import { handler } from "../../async.handler";
import UploadDocument from "../services/common/uploadDocToS3";
import userValidation from "./user.validation.js";

const upload = multer({
  dest: path.join(`${__dirname}/../services/uploadFiles`),
});

const router = express.Router();

const controller = new UserController();

class UserRoutes {
  static routes() {
    router.post(
      "/add-rating",
      checkSchema(Validator.addReview()),
      authenticate(["620ca6e733032d8eb3c3b239"]),
      handler(controller.addReview, (req) => [req])
    );

    router.get(
      "/notifications",
      handler(controller.getNotifications, (req) => [req])
    );

    router.get(
      "/transaction",
      handler(controller.getTransaction, (req) => [req])
    );

    router.post(
      "/validate-otp",
      checkSchema(Validator.validateOtp()),
      handler(controller.validateOtp, (req) => [req])
    );

    router.post(
      "/update-profile",
      checkSchema(Validator.profile()),
      handler(controller.updateProfile, (req) => [req])
    );

    router.put(
      "/update-status/:id",
      checkSchema(Validator.updateStatus()),
      handler(controller.updateStatus, (req) => [req])
    );

    router.post(
      "/update-password",
      checkSchema(Validator.updatePassword()),
      handler(controller.updatePassword, (req) => [req])
    );

    router.put(
      "/reset-password",
      checkSchema(Validator.resetPassword()),
      handler(controller.resetPassword, (req) => [req])
    );

    router.get(
      "/resend-otp",
      handler(controller.resendOtp, (req) => [req])
    );

    router.get(
      "/roles",
      handler(controller.getRoles, (req) => [req])
    );



    router.get(
      "/",
      handler(controller.getUser, (req) => [req])
    );

    /***   get all user list (except admin)  ***/
    router.post(
      "/list",
      handler(controller.getUserList, (req) => [req])
    );

    /***  get user by id  ***/
    router.get(
      "/:id",
      handler(controller.getUserById, (req) => [req])
    );

    /***  get expert list for specific subTalent  ***/
    router.get(
      "/expertList/:id",
      handler(controller.getExpertList, (req) => [req])
    );

    //*****  active inactive user by id *****//
    router.put(
      "/:id",
      handler(controller.activeInactive, (req) => [req])
    );

    router.post(
      "/upload-profile",
      upload.array("files"),
      handler(UploadDocument.uploadFiles, (req) => [req])
    );

    /***  delete user by id  ***/
    router.delete(
      "/:id",
      handler(controller.deleteUser, (req) => [req])
    );

    /***  delete user by id  ***/
    router.put(
      "/update/:id",
      checkSchema(userValidation.profile()),
      handler(controller.updateUser, (req) => [req])
    );

    // router.get("/stripe-integration/reauth",
    //   controller.stripeReAuth, (req, res) => [req, res]
    // );

    // router.get("/stripe-integration/return",
    //   controller.stripeReturn, (req, res) => [req, res]
    // );

    router.post("/contact-us",
      handler(controller.contactUs, (req) => [req])
    );

    router.post("/android-lead",
      handler(controller.androidLead, (req) => [req])
    );

    router.post("/android-lead-list",
      handler(controller.androidLeadList, (req) => [req])
    );

    /* validate user password */
    router.post("/validate-password",
      checkSchema(userValidation.validatePassword()),
      handler(controller.validatePassword, (req) => [req])
    );
    /* end */

    /* two factor authorization */
    router.post("/two-factor-auth",
      checkSchema(userValidation.twoFactorAuth()),
      handler(controller.twoFactorAuth, (req) => [req])
    );
    /* end */


    return router;
  }
}

export default UserRoutes.routes();
