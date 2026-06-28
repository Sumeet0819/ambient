// Load and validate env first — will exit if config is invalid
import { config } from './config';
import { logger } from './shared/logger';
import app from './app';
import { initWhatsApp, onMessage } from './modules/whatsapp/whatsapp.service';
import { handleIncomingMessage } from './modules/message/message.service';

async function bootstrap(): Promise<void> {
  logger.info({ env: config.NODE_ENV }, '🚀  Starting AI Finance Assistant backend…');

  // ── Start Express ──────────────────────────────────────────────────────
  app.listen(config.PORT, () => {
    logger.info(`🌐  HTTP server listening on http://localhost:${config.PORT}`);
  });

  // ── Start WhatsApp ────────────────────────────────────────────────────
  onMessage(handleIncomingMessage);
  await initWhatsApp();
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Fatal error during bootstrap');
  process.exit(1);
});
