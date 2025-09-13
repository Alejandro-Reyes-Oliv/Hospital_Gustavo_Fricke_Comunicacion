export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    const err = new Error("Validación fallida");
    err.status = 400;
    err.details = parsed.error.flatten();
    return next(err);
  }
  req.validated = parsed.data;
  next();
};
