import { param } from "express-validator";

class settingsValidator {
  field;

  constructor() {
    this.field = {
      email: {
        in: ["body"],
        errorMessage: "Please enter email",
      },
      password: {
        in: ["body"],
        errorMessage: "Please enter password",
      },
    };
  }
/* validate password validator */
  validatePassword = () => {
    return {
      password: {
        in: ["body"],
        exists: {
          errorMessage: "Password is required!",
        }
      },
    };
  };
  /* end */

  /* update user settings validator */
  updateSettings = () => {
    return {
      notifications: {
        in: ["body"],
          errorMessage: "Notifications are required!",
      },
      theme: {
        in: ["body"],
        errorMessage: "Theme is required!",
      },
      is_enabled_2fa: {
        in: ["body"],
        errorMessage: "Is enable 2fa is required!",
      },  
    };
  };
  /* end */

    /* change user password validator */
    changePassword = () => {
      return {
        old_password: {
          in: ["body"],
          exists: true,
          errorMessage: "Old password is required!",
        },
        new_password: {
          in: ["body"],
          exists: true,
          errorMessage: "New password is required!",
        },
      };
    };

}

export default new settingsValidator();
