import { validationResult } from "express-validator";

const errorFormatter = (error) => ({
  param: error.param,
  message: error.msg,
});

export const handler = (promise, params) => async (req, res, next) => {
  const boundParams = params ? params(req, res, next) : [];
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    const error = errors.mapped({ onlyFirstError: true });
    const response = {
      status: 400,
      success: false,
      message: Object.values(error)[0].message,
      data: {},
    };
    return res.status(400).json(response);
  }
  try {
    const result = await promise(...boundParams);
    if (
      result &&
      result.data &&
      result.data.type &&
      result.data.type === "xml"
    ) {
      res.set("Content-type", "text/xml");
      return res.send(result.data.xml);
    }

    return result.status == 401 ? res.status(result.status).send(result) : res.status(result.status).send(result);
  } catch (err) {
    const response = {
      status: 400,
      success: false,
      message: err.message || "",
      data: err,
    };
    return res.status(500).send(response);
  }
};
