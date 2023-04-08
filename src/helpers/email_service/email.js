// const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates');
const path = require('path');
const Promise = require('bluebird');

const CONFIG = process.env; 
// var sgTransport = require('nodemailer-sendgrid-transport');
const sendEmailToUser = (data) => {
    sgMail.setApiKey(CONFIG.SENDGRID_API_KEY);

    const msg = {
      to: data.to,
      from: process.env.SENDGRID_EMAIL,
      subject: data.subject,
      html: data.html,
    };
    console.log("msg : ", msg)
    sgMail.send(msg);
  };

function sendEmail(templateName, contexts) {
    console.log("path ====>>>", path.join(__dirname, 'email_templates', templateName))
    let template = new EmailTemplate({
      views: { root: path.join(__dirname, "email_templates", templateName) },
    });
    // console.log("Here...", template);
    return new Promise((resolve, reject) => {
        Promise.all(contexts.map((context) => {
            return new Promise((resolve, reject) => {
                console.log("context : ", context)
                template.render(context, (err, result) => {
                    if (err) reject(err);
                    else resolve({
                        email: result,
                        context,
                    });
                });
            });
        })).then(results => {
            return Promise.all(results.map((result) => {
                return new Promise((resolve, reject) => {
                    sendEmailToUser({
                        to: result.context.email,
                        from: '"Sample Title" <noreply@domain.com>',
                        subject: result.email.subject,
                        html: result.email.html,
                        // text: result.email.text,
                    }).then(status => {
                        resolve(status);
                    }).catch(err => {
                        reject(err);
                    })
                });
            })).then(finalResult => {
                resolve(finalResult)
            }).catch(err => {
                reject(err)
            })
        });
    })

}

module.exports = { sendEmail }