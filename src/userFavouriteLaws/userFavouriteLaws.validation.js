import { param } from "express-validator";

class UserFavouriteLawsValidator {
  field;

  constructor() {
    this.field = {
   
    };
  }
/* add favourite law validator */
addFavouriteLaw = () => {
    return {
      city: {
        in: ["body"],
        exists: {
          errorMessage: "City is required!",
        }
      },
      law_id: {
        in: ["body"],
        exists: {
          errorMessage: "Law id is required!",
        }
      },
    };
  };
  /* end */

  // /* two factor authorization validator */
  // twoFactorAuth = () => {
  //   return {
  //     type: {
  //       in: ["body"],
  //       exists: {
  //         errorMessage: "Type is required!",
  //       }
  //     },
  //     secret_2fa: {
  //       optional: { options: { nullable: false } },
  //     },
  //     otp: {
  //       in: ["body"],
  //       errorMessage: "OTP is required!",
  //     },
  //   };
  // };
  // /* end */
}

export default new UserFavouriteLawsValidator();
