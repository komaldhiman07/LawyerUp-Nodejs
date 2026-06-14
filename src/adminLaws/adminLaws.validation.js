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
    attribute_schema: {
      optional: { options: { nullable: true } },
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
    attribute_schema: {
      optional: { options: { nullable: true } },
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
    penalty_text:      { optional: { options: { nullable: false } } },
    status:            { optional: { options: { nullable: false } } },
    effective_from:    { optional: { options: { nullable: false } } },
    effective_to:      { optional: { options: { nullable: false } } },
    admin_note:        { optional: { options: { nullable: false } } },
    // Tier 1 fields
    legality:          { optional: { options: { nullable: false } } },
    legality_label:    { optional: { options: { nullable: false } } },
    penalty_severity:  { optional: { options: { nullable: false } } },
    statute_reference: { optional: { options: { nullable: false } } },
    official_url:      { optional: { options: { nullable: false } } },
    sources:           { optional: { options: { nullable: true } } },
    verified:          { optional: { options: { nullable: false } } },
    last_reviewed_at:  { optional: { options: { nullable: false } } },
    // Tier 2 fields
    key_points:        { optional: { options: { nullable: true } } },
    traveler_note:     { optional: { options: { nullable: false } } },
    numeric_value:     { optional: { options: { nullable: true } } },
    unit:              { optional: { options: { nullable: false } } },
    attributes:        { optional: { options: { nullable: true } } },
    reciprocity:       { optional: { options: { nullable: true } } },
  });

  updateStateLaw = () => ({
    title:             { optional: { options: { nullable: false } } },
    summary:           { optional: { options: { nullable: false } } },
    details:           { optional: { options: { nullable: false } } },
    penalty_text:      { optional: { options: { nullable: false } } },
    status:            { optional: { options: { nullable: false } } },
    effective_from:    { optional: { options: { nullable: false } } },
    effective_to:      { optional: { options: { nullable: false } } },
    admin_note:        { optional: { options: { nullable: false } } },
    // Tier 1 fields
    legality:          { optional: { options: { nullable: false } } },
    legality_label:    { optional: { options: { nullable: false } } },
    penalty_severity:  { optional: { options: { nullable: false } } },
    statute_reference: { optional: { options: { nullable: false } } },
    official_url:      { optional: { options: { nullable: false } } },
    sources:           { optional: { options: { nullable: true } } },
    verified:          { optional: { options: { nullable: false } } },
    last_reviewed_at:  { optional: { options: { nullable: false } } },
    // Tier 2 fields
    key_points:        { optional: { options: { nullable: true } } },
    traveler_note:     { optional: { options: { nullable: false } } },
    numeric_value:     { optional: { options: { nullable: true } } },
    unit:              { optional: { options: { nullable: false } } },
    attributes:        { optional: { options: { nullable: true } } },
    reciprocity:       { optional: { options: { nullable: true } } },
  });
}

export default new AdminLawsValidator();
