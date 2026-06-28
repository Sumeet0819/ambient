import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import path from 'path';
import { logger } from '../../shared/logger';
import { IncomingMessage } from '../../shared/types/incoming-message.type';

type MessageHandler = (message: IncomingMessage) => Promise<void>;

const SESSION_DIR = path.resolve(process.cwd(), 'sessions');


let sock: ReturnType<typeof makeWASocket> | null = null;
let messageHandler: MessageHandler | null = null;

/**
 * Register a handler that will be called for every incoming text message.
 */
export function onMessage(handler: MessageHandler): void {
  messageHandler = handler;
}

/**
 * Send a text message to a given JID (WhatsApp ID).
 * @param to  - Recipient JID, e.g. "919876543210@s.whatsapp.net"
 * @param text - Text to send
 */
export async function sendMessage(to: string, text: string): Promise<void> {
  if (!sock) {
    logger.warn('WhatsApp socket not ready — cannot send message');
    return;
  }
  await sock.sendMessage(to, { text });
}

/**
 * Initialise the Baileys WhatsApp socket.
 * Displays a QR code in the terminal on first run.
 * Saves session credentials to the `sessions/` directory.
 */
export async function initWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logger.info(`Using WA v${version.join('.')}${isLatest ? ' (latest)' : ''}`);

  sock = makeWASocket({
    version,
    logger: logger.child({ module: 'baileys' }) as any,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger.child({ module: 'wa-keys' }) as any),
    },
    generateHighQualityLinkPreview: false,
  });

  // ── QR Code ──────────────────────────────────────────────────────────────
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      logger.info('📱  Scan the QR code below with WhatsApp to link your device:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(
        { statusCode, shouldReconnect },
        'WhatsApp connection closed',
      );

      if (shouldReconnect) {
        logger.info('Reconnecting in 5 seconds…');
        setTimeout(() => initWhatsApp(), 5000);
      } else {
        logger.error('Logged out from WhatsApp — delete the sessions/ folder and restart to re-link');
      }
    }

    if (connection === 'open') {
      logger.info('✅  WhatsApp connected successfully');
    }
  });

  // ── Save credentials whenever they update ─────────────────────────────
  sock.ev.on('creds.update', saveCreds);

  // ── Incoming messages ─────────────────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Skip messages sent by ourselves
      if (msg.key.fromMe) continue;
      // Skip non-text messages for Phase 1
      if (!msg.message?.conversation && !msg.message?.extendedTextMessage) continue;

      const text =
        msg.message.conversation ?? msg.message.extendedTextMessage?.text ?? null;

      const sender = msg.key.remoteJid ?? 'unknown';
      const id = msg.key.id ?? 'unknown';
      const timestamp = new Date(
        (msg.messageTimestamp as number) * 1000,
      ).toISOString();

      const normalised: IncomingMessage = {
        id,
        source: 'whatsapp',
        sender,
        messageType: 'text',
        text,
        mediaUrl: null,
        timestamp,
      };

      logger.debug({ message: normalised }, 'Incoming WhatsApp message');

      if (messageHandler) {
        await messageHandler(normalised).catch((err) =>
          logger.error({ err }, 'Error in message handler'),
        );
      }
    }
  });
}
