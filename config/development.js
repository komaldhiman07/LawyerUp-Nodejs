import db from './db';

module.exports = {
  port: process.env.PORT,
  db: db.development,
  logger: {
    maxSize: 512000,
    maxFiles: 100,
  },
  secretKey: '@PeRmEX0@DeV',
  saltKey: '@$#W@N!)%!@2022',
  apiKey: ')%!@@$#W@N!2022',
  saltRounds: 2,
  gmail_username: process.env.GMAIL_USERNAME,
  gmail_password: process.env.GMAIL_PASSWORD
};
