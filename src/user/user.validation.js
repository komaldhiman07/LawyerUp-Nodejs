import { param } from "express-validator";

class UserValidator {
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

  login = () => this.field;

  validateOtp = () => {
    return {
      otp: {
        in: ["body"],
        errorMessage: "Please enter otp",
      },
    };
  };

  create = () => {
    const schema = {
      ...this.field,
      name: {
        in: ["body"],
        errorMessage: "Please enter name",
      },
    };
    return schema;
  };

  updatePassword = () => {
    return {
      oldPassword: {
        in: ["body"],
        required: true,
        errorMessage: "Please enter old password.",
      },
      password: {
        in: ["body"],
        errorMessage: "Please enter new password.",
      },
    };
  };

  resetPassword = () => {
    return {
      user_id: {
        in: ["body"],
        required: true,
        errorMessage: "Please provide a valid user.",
      },
      password: {
        in: ["body"],
        required: true,
        errorMessage: "Please enter new password.",
      },
    };
  };

  updateStatus = () => {
    return {
      status: {
        in: ["body"],
        errorMessage: "Please enter status.",
      },
    };
  };

  profile = () => {
    const schema = {
      profile_image: {
        optional: { options: { nullable: false } },
      },
      username: {
        optional: { options: { nullable: false } },
      },
      address: { optional: { options: { nullable: false } } },
    };
    return schema;
  };

  getClubs = () => {
    return {
      categoryIds: {
        optional: { options: { nullable: false, isArray: true } },
      },
      search: {
        optional: { options: { nullable: false } },
      },
    };
  };

  addReview = () => {
    return {
      album_id: {
        in: ["body"],
        errorMessage: "Please add album",
      },
      expert_id: {
        in: ["body"],
        errorMessage: "Please add expert",
      },
      rating: {
        in: ["body"],
        errorMessage: "Please add rating",
      },
      description: {
        optional: { options: { nullable: false } },
      },
    };
  };
}

export default new UserValidator();
