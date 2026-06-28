/**
 * Normalised representation of any incoming message,
 * regardless of source (WhatsApp, Telegram, API, etc.)
 */
export interface IncomingMessage {
  /** Unique message ID from the source platform */
  id: string;

  /** Source platform identifier */
  source: 'whatsapp' | 'telegram' | 'api' | 'sms';

  /** Sender identifier (e.g. phone number with country code) */
  sender: string;

  /** Type of media carried by the message */
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker';

  /** Plain text content of the message (if applicable) */
  text: string | null;

  /** URL to downloaded media (if applicable) */
  mediaUrl: string | null;

  /** ISO timestamp when the message was sent */
  timestamp: string;
}
