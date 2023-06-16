// class TwilioService {
//   constructor() {}

//   sendMessage = async (data) => {
//     const accountSid = process.env.TWILIO_ACCOUNT_SID;
//     const authToken = process.env.TWILIO_AUTH_TOKEN;
//     const client = require("twilio")(accountSid, authToken);

//     const message = await client.messages.create({
//       body: data.message,
//       messagingServiceSid: process.env.MESSAGE_SERVICE_SID,
//       to: data.to,
//     });
//     return message.sid;
//   };
// }

// export default new TwilioService();
