import { Router } from 'express';
import * as BotController from './bot.controller.js';

export const botRouter = Router();

// Enviar mensaje de confirmación para una cita
botRouter.post('/outbound', BotController.sendConfirmation);

// Ingesta de eventos normalizados (desde bot-gateway)
botRouter.post('/events', BotController.ingestEvent);

// Observabilidad mínima
botRouter.get('/messages', BotController.listMessagesByCita);
botRouter.get('/appointments/:id/confirmation', BotController.getConfirmationState);
