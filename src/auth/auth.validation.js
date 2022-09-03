class AuthValidator {
  field;

  constructor() {
    this.field = {
      
      password: {
        in: ["body"],
        exists:{
          errorMessage: "Please enter password",
        }
      },
      device_id: {
        in: ["body"],
        exists:{
          errorMessage: "Please enter password",
        }
      },
      device_type: {
        in: ["body"],
        exists:{
          errorMessage: "Please add device type",
        }
      },
      device_token: {
        in: ["body"],
        exists:{
          errorMessage: "Please add device token",
        }
      },
    };
  }

  login = () => {
    return {
      ...this.field,
      emailOrUsername:{
        in: ["body"],
        exists:{
          errorMessage: "Please enter email or username",
        }
      }
    }
  }

  logout = () => {
    return {
      device_id: {
        in: ["body"],
        errorMessage: "Please add device id",
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
        exists:{
          errorMessage: "Please enter username",
        }
      },
      email: {
        in: ["body"],
        exists:{
          errorMessage: "Please enter email",
        }
      },
      first_name: {
        in: ["body"],
        exists:{
          errorMessage: "Please enter first name",
        }
      },
      last_name: {
        in: ["body"],
        exists:{
          errorMessage: "Please enter last name",
        }
      },
      role_id: {
        in: ["body"],
        exists:{
          errorMessage: "Please select role",
        }
      },
      date_of_birth: {
        in: ["body"],
        exists:{
          errorMessage: "Please select date of birth",
        }
      },
      gender: {
        in: ["body"],
        exists:{
          errorMessage: "Please select gender",
        }
      },
      country_id: {
        optional: { options: { nullable: false } },
      },
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
}

export default new AuthValidator();
