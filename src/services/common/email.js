class EmailService {
  constructor() {}

  sendMail = (data) => {
    const sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: data.from,
      from: process.env.SENDGRID_EMAIL,
      subject: data.subject,
      html: data.text,
    };
    sgMail.send(msg);
  };
}

export default new EmailService();
