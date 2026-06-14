import { param } from 'express-validator';

class LawsValidator {
  field;

  constructor() {
    this.field = {
      email: {
        in: ['body'],
        errorMessage: 'Please enter email',
      },
      password: {
        in: ['body'],
        errorMessage: 'Please enter password',
      },
    };
  }

  /* raise law validator */
  raiseLaw = () => ({
    title: {
      in: ['body'],
      exists: true,
      errorMessage: 'Title is required!',
    },
    description: {
      in: ['body'],
      exists: true,
      errorMessage: 'Description is required!',
    },
    is_all_states: {
      in: ['body'],
      optional: true,
    },
    states: {
      in: ['body'],
      optional: true,
    },
    // ── Structured suggestion fields (all optional) ──────────────────────
    type: {
      in: ['body'],
      optional: true,
      isIn: {
        options: [['missing', 'error', 'update']],
        errorMessage: 'Type must be missing, error, or update',
      },
    },
    state_code: {
      in: ['body'],
      optional: true,
    },
    law_key: {
      in: ['body'],
      optional: true,
    },
    source_url: {
      in: ['body'],
      optional: true,
    },
    linked_law_id: {
      in: ['body'],
      optional: true,
    },
  });
  /* end */

report = () => ({
  source: {
    in: ['body'],
    exists: true,
    errorMessage: 'Source is required!',
  },
  destination: {
    in: ['body'],
    exists: true,
    errorMessage: 'Destination is required!',
  },
});
/* end */
}

export default new LawsValidator();
