import { param } from 'express-validator';

class ContactUsValidator {
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

  /* contact us validator */
  contactUs = () => ({
    subject: {
      in: ['body'],
      exists: true,
      errorMessage: 'Subject is required!',
    },
    message: {
      in: ['body'],
      exists: true,
      errorMessage: 'Message is required!',
    },
  });
  /* end */

}

export default new ContactUsValidator();
