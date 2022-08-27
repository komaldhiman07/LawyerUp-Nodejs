const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { jwtToken, saltRounds } = require('../../config/keys');

const extractToken = (authToken) => {
  if (authToken) {
    const split = authToken.split(' ');
    if (split.length > 1) {
      return split[1];
    }
    return authToken;
  }
  return authToken;
};

export const verifyToken = (authorization) => {
  try {
    const token = extractToken(authorization);
    const decoded = jwt.verify(token, jwtToken);
    return decoded
  } catch (error) {
    return error.message
  }
};

export const refreshToken = (payload) => jwt.sign(payload, jwtToken, { expiresIn: '365d' });

export const setResponseToken = (res, token) => res.set('authorization', token);

export const generateHash = async (text) => {
  const hash = await bcrypt.hash(text, saltRounds);
  return hash;
};
