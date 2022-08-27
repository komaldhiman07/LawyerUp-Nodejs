import db from './db';

module.exports = {
  port: process.env.PORT,
  db: db.production,
  logger: {
    maxSize: 5120000,
    maxFiles: 200,
  },
  secretKey: '@PeRmEX0@Pr0D',
  saltKey: '@$#W@N!)%!@2022',
  apiKey: ')%!@@$#W@N!2022',
  saltRounds: 2,
};
