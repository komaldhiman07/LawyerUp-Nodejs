import express from "express";
import { checkSchema } from "express-validator";

import AuthController from "./auth.controller.js";
import Validator from "./auth.validation.js";
import { handler } from "../../async.handler";

const router = express.Router();

const controller = new AuthController();

class AuthRoutes {
  static routes() {
    router.post(
      "/login",
      checkSchema(Validator.login()),
      handler(controller.login, (req) => [req])
    );

    router.post(
      "/logout",
      checkSchema(Validator.logout()),
      handler(controller.logout, (req) => [req])
    );

    router.post(
      "/sign-up",
      checkSchema(Validator.create()),
      handler(controller.create, (req) => [req])
    );

    router.post(
      "/forgot-password",
      checkSchema(Validator.forgotPassword()),
      handler(controller.forgotPassword, (req) => [req])
    );

    router.post(
      "/otp-verification",
      checkSchema(Validator.validateOtp()),
      handler(controller.validateOtp, (req) => [req])
    );
    
    router.post(
      "/resend-otp",
      checkSchema(Validator.forgotPassword()),
      handler(controller.resendOtp, (req) => [req])
    );
    router.post(
      "/set-new-password",
      checkSchema(Validator.validatePassword()),
      handler(controller.setNewPassword, (req) => [req])
    );
    router.post(
      "/social-signup",
      checkSchema(Validator.socialSignUp()),
      handler(controller.socialSignUp, (req) => [req])
    );

    router.post(
      "/social-login",
      checkSchema(Validator.socialLogin()),
      handler(controller.socialLogin, (req) => [req])
    );
    return router;
  }
}

export default AuthRoutes.routes();
