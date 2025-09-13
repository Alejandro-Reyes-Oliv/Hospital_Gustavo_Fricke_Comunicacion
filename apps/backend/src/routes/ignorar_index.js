import { Router } from 'express';
import { ping } from '../controllers/ignorar_health.controller.js';

const router = Router();

router.get('/ping', ping);

// (luego) router.post('/webhooks/bot', botWebhookController);
// (luego) router.post('/citas/:id/enviar-confirmacion', enviarConfirmacionController);

export default router;
