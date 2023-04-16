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
      errorMessage: 'Is all states is required!',
    },
    states: {
      in: ['body'],
      errorMessage: 'States are required!',
    },
  });
  /* end */
}

export default new LawsValidator();
