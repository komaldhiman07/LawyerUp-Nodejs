import db from './db';

module.exports = {
  port: process.env.PORT,
  db: db.staging,
  logger: {
    maxSize: 512000,
    maxFiles: 100,
  },
  secretKey: '@PeRmEX0@$t@g!nG',
  saltKey: '@$#W@N!)%!@2022',
  apiKey: ')%!@@$#W@N!2022',
  saltRounds: 2,
};
