export const authenticate = (roles = []) => {
  if (typeof roles === "string") {
    roles = [roles];
  }

  return [
    (req, res, next) => {
      if (roles.length && !roles.includes(req.user.data.role_id._id)) {
        return res.status(401).json({
          status: 401,
          success: false,
          message: "Unauthorized",
          data: {},
        });
      }
      next();
    },
  ];
};
