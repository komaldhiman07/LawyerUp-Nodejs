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
      club_name: {
        optional: { options: { nullable: false } },
      },
      first_name: {
        optional: { options: { nullable: false } },
      },
      last_name: { optional: { options: { nullable: false } } },
      phone: {
        optional: { options: { nullable: false } },
      },
      email: {
        optional: { options: { nullable: false } },
      },
      address: {
        optional: { options: { nullable: false } },
      },
      public_profile_url: {
        optional: { options: { nullable: false } },
      },
      crediential_document: {
        optional: { options: { nullable: false } },
      },
      competition_category: {
        optional: { options: { nullable: false } },
      },
      city: {
        optional: { options: { nullable: false } },
      },
      state_id: {
        optional: { options: { nullable: false } },
      },
      country_id: {
        optional: { options: { nullable: false } },
      },
      zip_code: {
        optional: { options: { nullable: false } },
      },
      photo_id_url: {
        optional: { options: { nullable: false } },
      },
      language: {
        optional: { options: { nullable: false } },
      },
      gender: {
        optional: { options: { nullable: false } },
      },
      talent: {
        optional: { options: { nullable: false } },
      },
      club: {
        optional: { options: { nullable: false } },
      },
      experience: {
        optional: { options: { nullable: false } },
      },
      specialization: {
        optional: { options: { nullable: false } },
      },
      price: {
        optional: { options: { nullable: false } },
      },
      time_period: {
        optional: { options: { nullable: false } },
      },
      age: {
        optional: { options: { nullable: false } },
      },
      type_of_club: {
        optional: { options: { nullable: false } },
      },
      initials_for_concent: {
        optional: { options: { nullable: false } },
      },
      initials_for_date: {
        optional: { options: { nullable: false } },
      },
      url: {
        optional: { options: { nullable: false } },
      },
      coach_name: {
        optional: { options: { nullable: false } },
      },
      coach_email: {
        optional: { options: { nullable: false } },
      },
      coach_phone: {
        optional: { options: { nullable: false } },
      },
      other_club_name: {
        optional: { options: { nullable: false } },
      },
      term_and_condition: {
        optional: {
          optional: { options: { nullable: false } },
        }
      },
      declaration: {
        optional: {
          optional: { options: { nullable: false } },
        }
      }
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
