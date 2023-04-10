class AuthValidator {
  field;

  constructor() {
    this.field = {

      password: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter password",
        }
      },
      device_id: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter device_id",
        }
      },
      device_type: {
        in: ["body"],
        exists: {
          errorMessage: "Please add device type",
        }
      },
      device_token: {
        in: ["body"],
        exists: {
          errorMessage: "Please add device token",
        }
      },
    };
  }

  login = () => {
    return {
      ...this.field,
      emailOrUsername: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter email or username",
        }
      }
    }
  }

  logout = () => {
    return {
      device_token: {
        in: ["body"],
        errorMessage: "Device token is required!",
      },
    };
  };

  socialLogin = () => {
    return {
      social_key: {
        in: ["body"],
        errorMessage: "Please enter social_key",
      },
      device_id: {
        in: ["body"],
        errorMessage: "Please add device id",
      },
      device_type: {
        in: ["body"],
        errorMessage: "Please add device type",
      },
      device_token: {
        in: ["body"],
        errorMessage: "Please add device token",
      },
    };
  };

  socialSignUp = () => {
    const schema = {
      social_key: {
        in: ["body"],
        errorMessage: "Please enter social_key",
      },
      login_type: {
        in: ["body"],
        errorMessage: "Please enter login type",
      },
      role_id: {
        in: ["body"],
        errorMessage: "Please select role",
      },
      first_name: {
        optional: { options: { nullable: false } },
      },
      last_name: {
        optional: { options: { nullable: false } },
      },
      phone: {
        optional: { options: { nullable: false } },
      },
      email: {
        optional: { options: { nullable: false } },
      },
      device_id: {
        in: ["body"],
        errorMessage: "Please add device id",
      },
      device_type: {
        in: ["body"],
        errorMessage: "Please add device type",
      },
      device_token: {
        in: ["body"],
        errorMessage: "Please add device token",
      },
    };
    return schema;
  };

  create = () => {
    const schema = {
      ...this.field,
      profile_image: {
        optional: { options: { nullable: false } },
      },
      username: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter username",
        }
      },
      email: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter email",
        }
      },
      first_name: {
        in: ["body"],
        exists: {
          errorMessage: "Please enter first name",
        }
      },
      last_name: {
        optional: { options: { nullable: false } },
        // in: ["body"],
        // exists:{
        //   errorMessage: "Please enter last name",
        // }
      },
      role_id: {
        in: ["body"],
        exists: {
          errorMessage: "Please select role",
        }
      },
      date_of_birth: {
        optional: { options: { nullable: false } },
        // in: ["body"],
        // exists: {
        //   errorMessage: "Please select date of birth",
        // }
      },
      gender: {
        optional: { options: { nullable: false } },
        // in: ["body"],
        // isIn: {
        //   options: [["male", "female", ""]],
        //   errorMessage: "Invalid gender. It should be one of 'male' or 'female'"
        // }
        // exists: {
        //   errorMessage: "Please select gender",
        // }
        // optional: { options: { nullable: false } },
      },
      country_id: {
        optional: { options: { nullable: false } },
      },
      address: {
        optional: { options: { nullable: false } },
      },
      // state_id: {
      //   in: ["body"],
      //   exists: {
      //     errorMessage: "Please select a state",
      //   }
      // },
      state: {
        optional: { options: { nullable: false } },
      },
      city: {
        optional: { options: { nullable: false } },
      },
      language: {
        optional: { options: { nullable: false } },
      },
      zip_code: {
        optional: { options: { nullable: false } },
      },
      is_enable_location: {
        optional: { options: { nullable: false } },
      },
      is_receive_notification: {
        optional: { options: { nullable: false } },
      },
      is_enable_notification: {
        optional: { options: { nullable: false } },
      },
    };
    return schema;
  };

  forgotPassword = () => {
    return {
      emailOrUsername: {
        in: ["body"],
        errorMessage: "Please enter email or username",
      },
    };
  };
  validateOtp = () => {
    return {
      emailOrUsername: {
        in: ["body"],
        errorMessage: "Please enter email or username",
      },
      otp: {
        in: ["body"],
        errorMessage: "Please enter otp",
      },
    }
  }
  validatePassword = () => {
    return {
      emailOrUsername: {
        in: ["body"],
        errorMessage: "Please enter email or username",
      },
      password: {
        in: ["body"],
        errorMessage: "Please enter password",
      }, 
      otp: {
        in: ["body"],
        errorMessage: "Please enter otp",
      }, 
    }
  }
}

export default new AuthValidator();
