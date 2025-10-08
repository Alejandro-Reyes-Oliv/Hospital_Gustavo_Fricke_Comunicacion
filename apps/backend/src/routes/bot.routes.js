import { Router } from "express";
import { sendRemindersForCitas } from "../services/bot.service.js";

const router = Router();

router.post("/bot/send", async (req, res) => {
  try {
    const { citaIds } = req.body;
    if (!Array.isArray(citaIds) || !citaIds.length) return res.status(400).json({ ok:false, error:"citaIds vacío" });
    const report = await sendRemindersForCitas(citaIds);
    res.json({ ok: true, report });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:"internal_error" });
  }
});

export default router;
