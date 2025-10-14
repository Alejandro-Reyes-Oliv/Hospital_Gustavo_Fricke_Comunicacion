import bodyParser from "body-parser";

/** Captura rawBody para firma y luego parsea JSON (solo para /webhook/whatsapp) */
export function webhookMiddleware() {
  const raw = bodyParser.raw({ type: "*/*" });
  return [
    raw,
    (req, _res, next) => {
      req.rawBody = req.body; // Buffer
      try {
        if (req.is("application/json") && Buffer.isBuffer(req.body)) {
          req.body = JSON.parse(req.body.toString("utf8"));
        }
      } catch {}
      next();
    },
  ];
}
