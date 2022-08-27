import stripeService from "./stripe.service";
import { RESPONSE_CODES } from "../../config/constants.js";
import { CUSTOM_MESSAGES } from "../../config/customMessages.js";
import { matchedData } from "express-validator";
import {
  linkStripeAccount,
  retriveAccount,
  createCharge,
  createTransfer,
  createCard,
  cardList,
  deleteCard,
  makeDefaultCard,
} from "../services/common/stripe";
import mongoose from "mongoose";

class StripeController {
  constructor() {}

  linkStripeAccount = async (req) => {
    if (req.user.data.role_id._id != "620ca6da33032d8eb3c3b236") {
      return {
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      };
    }
    const user = await stripeService.getUser({ _id: req.user.data._id });
    const linkAccount = await linkStripeAccount(user);
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      created: linkAccount.created,
      expires_at: linkAccount.expires_at,
      object: linkAccount.object,
      url: linkAccount.url,
    };
  };

  retriveAccount = async (req) => {
    let user = null;
    const response = {};
    let apndMsg = null;
    if (req.user.data.role_id._id != "620ca6da33032d8eb3c3b236") {
      user = await stripeService.getUser({ _id: req.params.id });
      if (user.role_id != "620ca6da33032d8eb3c3b236") {
        return {
          status: RESPONSE_CODES.BAD_REQUEST,
          success: false,
          data: {},
          message: CUSTOM_MESSAGES.USER_NOT_FOUND,
        };
      }
    } else {
      user = await stripeService.getUser({ _id: req.user.data._id });
    }
    const account = await retriveAccount(user);
    if (account.charges_enabled) {
      if (!account.capabilities.card_payments) {
        response.chargesEnabled = 0;
        response.message =
          "Thanks for providing your information for the Stripe verification process! Looks like something may be wrong. We want to make sure you get paid, so please navigate to your profile section to review and edit any items that may be incorrect in the Stripe section.\n\nDon't worry, this happens! Usually, it's a simple error with your bank account / debit card numbers or information on file.";
      } else {
        if (account.requirements.currently_due.length == 0) {
          response.chargesEnabled = 1;
          response.message =
            "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments!";
        } else {
          response.chargesEnabled = 2;

          if (account.requirements.errors.length > 0) {
            apndMsg = account.requirements.errors[0].requirement;
            apndMsg = apndMsg.replace(/,/g, "\n");
            response.message =
              "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments but please review the below items which need attention\n\n" +
              apndMsg;
          } else if (account.requirements.currently_due.length > 0) {
            apndMsg = account.requirements.currently_due.toString();
            apndMsg = apndMsg.replace(/,/g, "\n");
            response.message =
              "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments but please review the below items which need attention\n\n" +
              apndMsg;
          } else {
            response.chargesEnabled = 1;
            response.message =
              "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments!";
          }
        }
      }
    } else {
      if (account.requirements.errors.length > 0) {
        apndMsg = account.requirements.errors[0].requirement;
        apndMsg = apndMsg.replace(/,/g, "\n");
        response.chargesEnabled = 0;
        response.message =
          "Your account is pending. Stripe may need some additional information to confirm your identity.\nPlease review the items below, and update your information. Thanks!\n\n" +
          apndMsg;
      } else if (account.requirements.pending_verification.length > 0) {
        apndMsg = account.requirements.pending_verification.toString();
        apndMsg = apndMsg.replace(/,/g, "\n");
        response.chargesEnabled = 0;
        response.message =
          "Your account is pending. Stripe may need some additional information to confirm your identity.\nPlease review the items below, and update your information. Thanks!\n\n" +
          apndMsg;
      } else if (account.requirements.currently_due.length > 0) {
        response.chargesEnabled = 0;
        response.message =
          "Kindly complete your onboarding process with Stripe.";
      } else {
        response.chargesEnabled = 3;
        response.message = "Your account is under review";
      }
    }
    await stripeService.updateUserStripeStatus(
      { _id: user._id },
      { chargesEnabled: response.chargesEnabled }
    );
    return {
      status: RESPONSE_CODES.GET,
      success: true,
      message: CUSTOM_MESSAGES.ACCOUNT_DETAILS,
      data: response,
    };
  };

  createCharge = async (req) => {
    const data = matchedData(req);
    if (req.user.data.role_id._id != "620ca6e733032d8eb3c3b239") {
      return {
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      };
    }
    const query = {
      _id: data.album_id,
      is_deleted: false,
      post_status: true,
    };
    const user = await stripeService.getUser({ _id: req.user.data._id });
    const isPost = await stripeService.getAlbumDetail(query);
    if (!isPost) {
      return {
        status: RESPONSE_CODES.POST,
        success: false,
        message: CUSTOM_MESSAGES.ALBUM_NOT_FOUND,
        data: null,
      };
    }
    await makeDefaultCard(user.stripe_customer_id, data.card_id);
    data.expert_id = isPost.experts[0]._id;
    data.performer_id = user._id;
    data.transfer_group = `Group_${data.album_id}`;
    data.stripe_account_id = isPost.experts[0].stripe_account_id;
    const charge = await createCharge(user.stripe_customer_id, data);
    data.charge_id = charge.id;
    data.transaction_id = charge.balance_transaction;
    data.card_id = charge.source.id;
    data.created_at = new Date();
    const response = {
      status: RESPONSE_CODES.POST,
    };
    if (charge.status == "succeeded") {
      data.transaction_status = "captured";
      response.success = true;
      response.message = CUSTOM_MESSAGES.TRANSACTION_SUCCESS;
    } else {
      data.transaction_status = "failed";
      response.success = false;
      response.message = CUSTOM_MESSAGES.TRANSACTION_FAILED;
    }
    response.data = null;
    await stripeService.createTransaction(data);
    return response;
  };

  createTransfer = async (req) => {
    const transfer = await createTransfer("acct_1LFxrRDFYpxY3iaE");
    return transfer;
  };

  createCard = async (req) => {
    const { body } = req;
    if (req.user.data.role_id._id != "620ca6e733032d8eb3c3b239") {
      return {
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      };
    }
    const user = await stripeService.getUser({ _id: req.user.data._id });
    const card = await createCard(user.stripe_customer_id, body);
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.CRAD_ADDED,
      data: card,
    };
  };

  cardList = async (req) => {
    if (req.user.data.role_id._id != "620ca6e733032d8eb3c3b239") {
      return {
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      };
    }
    const user = await stripeService.getUser({ _id: req.user.data._id });
    const card_list = await cardList(user.stripe_customer_id);
    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.CARD_LIST,
      data: card_list,
    };
  };

  deleteCard = async (req) => {
    const { body } = req;
    if (req.user.data.role_id._id != "620ca6e733032d8eb3c3b239") {
      return {
        status: RESPONSE_CODES.UNAUTHORIZED,
        success: false,
        data: {},
        message: CUSTOM_MESSAGES.UNAUTHORIZED,
      };
    }
    const user = await stripeService.getUser({ _id: req.user.data._id });
    const deleted_card = await deleteCard(
      user.stripe_customer_id,
      body.card_id
    );
    console.log(deleted_card);
    if (deleted_card.deleted) {
      return {
        status: RESPONSE_CODES.DELETE,
        success: true,
        message: CUSTOM_MESSAGES.CARD_DELETED,
      };
    } else {
      return {
        status: RESPONSE_CODES.DELETE,
        success: false,
        message: deleted_card.message,
      };
    }
  };

  transactionList = async (req) => {
    const data = req.body;
    const options = {
      lean: true,
      populate: [
        {
          path: "expert_id",
          select: "first_name last_name experience profile_image averageRating",
        },
        {
          path: "performer_id",
          select: "first_name last_name profile_image",
        },
        {
          path: "album_id",
        },
      ],
      sort: { created_at: -1 },
    };
    const query = {};
    if (req.user.data.role_id._id == "620ca6e733032d8eb3c3b239") {
      query.performer_id = mongoose.Types.ObjectId(req.user.data._id);
      query.transaction_status = ["succeeded", "captured", "failed"];
    }
    if (req.user.data.role_id._id == "620ca6da33032d8eb3c3b236") {
      query.expert_id = mongoose.Types.ObjectId(req.user.data._id);
      query.transaction_status = ["succeeded", "failed"];
    }
    if (data.start) {
      options["offset"] = data.start ? data.start : 0;
    }
    if (data.length) {
      options["limit"] = data.length ? data.length : 10;
    }
    const list = await stripeService.findTransactionList(query, options);

    return {
      status: RESPONSE_CODES.POST,
      success: true,
      message: CUSTOM_MESSAGES.TRANSACTION_LIST,
      data: list,
    };
  };

  updateExpertStripeStatus = async (req) => {
    const response = {}
    let apndMsg = null
    const allExpert = await stripeService.getAllUser({
      role_id: "620ca6da33032d8eb3c3b236",
      is_deleted: false,
    });
    for (const ele of allExpert) {
      if (ele.stripe_account_id) {
        const account = await retriveAccount(ele);
        if (account.charges_enabled) {
          if (!account.capabilities.card_payments) {
            response.chargesEnabled = 0;
            response.message =
              "Thanks for providing your information for the Stripe verification process! Looks like something may be wrong. We want to make sure you get paid, so please navigate to your profile section to review and edit any items that may be incorrect in the Stripe section.\n\nDon't worry, this happens! Usually, it's a simple error with your bank account / debit card numbers or information on file.";
          } else {
            if (account.requirements.currently_due.length == 0) {
              response.chargesEnabled = 1;
              response.message =
                "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments!";
            } else {
              response.chargesEnabled = 2;

              if (account.requirements.errors.length > 0) {
                apndMsg = account.requirements.errors[0].requirement;
                apndMsg = apndMsg.replace(/,/g, "\n");
                response.message =
                  "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments but please review the below items which need attention\n\n" +
                  apndMsg;
              } else if (account.requirements.currently_due.length > 0) {
                apndMsg = account.requirements.currently_due.toString();
                apndMsg = apndMsg.replace(/,/g, "\n");
                response.message =
                  "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments but please review the below items which need attention\n\n" +
                  apndMsg;
              } else {
                response.chargesEnabled = 1;
                response.message =
                  "Thanks for linking your account to Stripe for payments! You are now all set to recieve payments!";
              }
            }
          }
        } else {
          if (account.requirements.errors.length > 0) {
            apndMsg = account.requirements.errors[0].requirement;
            apndMsg = apndMsg.replace(/,/g, "\n");
            response.chargesEnabled = 0;
            response.message =
              "Your account is pending. Stripe may need some additional information to confirm your identity.\nPlease review the items below, and update your information. Thanks!\n\n" +
              apndMsg;
          } else if (account.requirements.pending_verification.length > 0) {
            apndMsg = account.requirements.pending_verification.toString();
            apndMsg = apndMsg.replace(/,/g, "\n");
            response.chargesEnabled = 0;
            response.message =
              "Your account is pending. Stripe may need some additional information to confirm your identity.\nPlease review the items below, and update your information. Thanks!\n\n" +
              apndMsg;
          } else if (account.requirements.currently_due.length > 0) {
            response.chargesEnabled = 0;
            response.message =
              "Kindly complete your onboarding process with Stripe.";
          } else {
            response.chargesEnabled = 3;
            response.message = "Your account is under review";
          }
        }
        await stripeService.updateUserStripeStatus(
          { _id: ele._id },
          { chargesEnabled: response.chargesEnabled }
        );
      }
    }
    return {
        status: RESPONSE_CODES.PUT,
        success: true,
        message: CUSTOM_MESSAGES.STAUTS_UPDATED,
        data: null,
      };
  };
}

export default StripeController;
