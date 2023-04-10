// const path = require('path');
// const Promise = require('bluebird');

// var sgTransport = require('nodemailer-sendgrid-transport');
import config from 'config';

import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

module.exports.sendEmail = async (templateName, contexts) => {
  return Promise.all(contexts.map((k) => {
    return new Promise(async (resolve, reject) => {
      const filePath = path.join(__dirname, `/email_templates/${templateName}/html.hbs`);
      const source = fs.readFileSync(filePath, 'utf-8').toString();
      const template = handlebars.compile(source);

      const htmlToSend = template(k);
      const transporter = nodemailer.createTransport({
        //FOR GMAIL
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: config.gmail_username,
          pass: config.gmail_password,
        },
      });
      const mailOptions = {
        from: '"komaldhiman143@gmail.com" <noreply@gmail.com>',
        to: k.email,
        subject: k.subject,
        html: htmlToSend
      };
      try {
        await transporter.sendMail(mailOptions);
        resolve({ success: true, message: 'Email sent successfully' })
      } catch (e) {
        reject({ success: false, message: e.message })
      }
    })
  })
  )}

// exports.sendEmail;