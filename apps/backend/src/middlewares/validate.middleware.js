import { ZodError } from "zod";

export const validate = (schema) => (req, _res, next) => {
  try {
    if (!schema) return next();
    const input = ["GET", "DELETE"].includes(req.method) ? req.query : req.body;
    const parsed = schema.parse(input);
    req.validated = parsed;
    next();
  } catch (e) {
    if (e instanceof ZodError) {
      e.status = 400;
      e.code = "BAD_REQUEST";
      e.details = e.issues;
    }
    next(e);
  }
};
