import { Router } from "express";
import { verifyWebhook, receiveWebhook } from "./controllers.webhook.js";
const r = Router();
r.get("/", verifyWebhook);
r.post("/", receiveWebhook);
export default r;
