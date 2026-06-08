class AdminLawsValidator {
  createLawMaster = () => ({
    law_key: {
      in: ["body"],
      exists: true,
      errorMessage: "law_key is required!",
    },
    title: {
      in: ["body"],
      exists: true,
      errorMessage: "title is required!",
    },
    severity: {
      optional: { options: { nullable: false } },
    },
    risk_score: {
      optional: { options: { nullable: false } },
    },
  });

  updateLawMaster = () => ({
    title: {
      optional: { options: { nullable: false } },
    },
    short_title: {
      optional: { options: { nullable: false } },
    },
    description_global: {
      optional: { options: { nullable: false } },
    },
    domain: {
      optional: { options: { nullable: false } },
    },
    sub_domain: {
      optional: { options: { nullable: false } },
    },
    tags: {
      optional: { options: { nullable: false } },
    },
    severity: {
      optional: { options: { nullable: false } },
    },
    risk_score: {
      optional: { options: { nullable: false } },
    },
    is_active: {
      optional: { options: { nullable: false } },
    },
  });

  createStateLaw = () => ({
    state_code: {
      in: ["body"],
      exists: true,
      errorMessage: "state_code is required!",
    },
    law_key: {
      in: ["body"],
      exists: true,
      errorMessage: "law_key is required!",
    },
    title: {
      in: ["body"],
      exists: true,
      errorMessage: "title is required!",
    },
    summary: {
      in: ["body"],
      exists: true,
      errorMessage: "summary is required!",
    },
    details: {
      in: ["body"],
      exists: true,
      errorMessage: "details is required!",
    },
    status: {
      optional: { options: { nullable: false } },
    },
    effective_from: {
      optional: { options: { nullable: false } },
    },
    effective_to: {
      optional: { options: { nullable: false } },
    },
  });

  updateStateLaw = () => ({
    title: {
      optional: { options: { nullable: false } },
    },
    summary: {
      optional: { options: { nullable: false } },
    },
    details: {
      optional: { options: { nullable: false } },
    },
    penalty_text: {
      optional: { options: { nullable: false } },
    },
    status: {
      optional: { options: { nullable: false } },
    },
    effective_from: {
      optional: { options: { nullable: false } },
    },
    effective_to: {
      optional: { options: { nullable: false } },
    },
    admin_note: {
      optional: { options: { nullable: false } },
    },
  });
}

export default new AdminLawsValidator();
