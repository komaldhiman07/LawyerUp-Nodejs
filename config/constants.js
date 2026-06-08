// SEC-03: Single source of truth for role IDs — never hardcode these elsewhere
export const ROLE_IDS = {
  ADMIN: process.env.ADMIN_ROLE_ID || "620504e9f47dd88dfc51e183",
  USER:  process.env.USER_ROLE_ID  || "620ca6da33032d8eb3c3b236",
};

export const RESPONSE_CODES = {
  GET: 200,
  POST: 201,
  DELETE: 204,
  PUT: 204,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
};
export const ADMIN_EMAIL = "komaldhiman143@gmail.com";
export const THEME = {
  LIGHT: "light",
  DARK: "dark"
};
export const TWO_FACTOR_AUTH_TYPE = {
  GENERATE: "generate",
  VERIFY: "verify",
};

export const DEFAULT = {
  TRUE: 1,
  FALSE: 0,
};
