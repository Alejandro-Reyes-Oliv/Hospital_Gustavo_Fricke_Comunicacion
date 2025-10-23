// apps/backend/src/routes/bot.routes.js
import e, { Router } from 'express';
import * as BotController from '../controllers/bot.controller.js';

const router = Router();

// Quedará /api/bot/outbound, /api/bot/events, etc.
//router.post('/bot/outbound', BotController.sendConfirmation);
router.post('/bot/events', BotController.ingestEvent);

// Observabilidad
//router.get('/bot/messages', BotController.listMessagesByCita);
//router.get('/appointments/:id/confirmation', BotController.getConfirmationState);

export default router;
