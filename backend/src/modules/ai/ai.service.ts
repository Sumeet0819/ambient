import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import { config } from '../../config';
import { logger } from '../../shared/logger';

// ── Gemini client ────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

// Free tier limits: gemini-1.5-flash → 15 RPM, 1M TPM, 1500 RPD
const MODEL = 'gemini-3.5-flash';

// ── Zod schema for validated AI output ───────────────────────────────────────
export const ParsedTransactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer', 'loan', 'investment', 'subscription', 'unknown']),
  amount: z.number().nullable(),
  currency: z.string().default('INR'),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  notes: z.string().nullable(),
  isFinancial: z.boolean(),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a financial transaction parser for an Indian personal finance app.
Your job is to extract structured transaction data from natural language messages in English, Hindi, or Hinglish.

Rules:
- Default currency is INR (Indian Rupees). ₹, rs, rupe, rupees all mean INR.
- If the message is NOT about a financial transaction (e.g. greetings, questions, random text), set isFinancial to false and all other fields to null.
- For type: use "expense" for spending/payment, "income" for receiving money/salary, "transfer" for sending to someone, "loan" for lending/borrowing, "investment" for stocks/mutual funds, "subscription" for recurring services.
- Infer category from context: Food, Transport, Shopping, Entertainment, Health, Utilities, Rent, Salary, Investment, Subscription, Other.
- paymentMethod options: cash, upi, card, netbanking, or null if unknown.
- Always return valid JSON matching the schema exactly. No markdown, no explanation.`;

// ── Gemini function calling schema ────────────────────────────────────────────
const extractTransactionTool = {
  name: 'extract_transaction',
  description: 'Extract structured financial transaction data from a natural language message',
  parameters: {
    type: Type.OBJECT,
    properties: {
      isFinancial: {
        type: Type.BOOLEAN,
        description: 'Whether the message is about a financial transaction',
      },
      type: {
        type: Type.STRING,
        enum: ['expense', 'income', 'transfer', 'loan', 'investment', 'subscription', 'unknown'],
        description: 'Type of transaction',
      },
      amount: {
        type: Type.NUMBER,
        description: 'Transaction amount as a number, or null if not found',
      },
      currency: {
        type: Type.STRING,
        description: 'Currency code, default INR',
      },
      merchant: {
        type: Type.STRING,
        description: 'Merchant or person name, or null',
      },
      category: {
        type: Type.STRING,
        description: 'Category: Food, Transport, Shopping, Entertainment, Health, Utilities, Rent, Salary, Investment, Subscription, Other, or null',
      },
      paymentMethod: {
        type: Type.STRING,
        description: 'Payment method: cash, upi, card, netbanking, or null',
      },
      notes: {
        type: Type.STRING,
        description: 'Any additional notes from the message, or null',
      },
    },
    required: ['isFinancial', 'type', 'amount', 'currency', 'merchant', 'category', 'paymentMethod', 'notes'],
  },
};

/**
 * Parse a natural language message and extract transaction data using Gemini.
 * Returns null if the message is not financial or parsing fails.
 * Retries once with backoff on 429 rate-limit errors.
 */
export async function parseTransaction(text: string): Promise<ParsedTransaction | null> {
  return _callGemini(text, 0);
}

async function _callGemini(text: string, attempt: number): Promise<ParsedTransaction | null> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\nMessage: "${text}"` }] },
      ],
      config: {
        tools: [{ functionDeclarations: [extractTransactionTool] }],
        toolConfig: { functionCallingConfig: { mode: 'ANY' as any } },
      },
    });

    // Extract function call result
    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (!part?.functionCall?.args) {
      logger.warn({ text }, 'Gemini returned no function call — not a financial message');
      return null;
    }

    const raw = part.functionCall.args as Record<string, unknown>;
    const parsed = ParsedTransactionSchema.safeParse({
      ...raw,
      amount: raw.amount ?? null,
      merchant: raw.merchant ?? null,
      category: raw.category ?? null,
      paymentMethod: raw.paymentMethod ?? null,
      notes: raw.notes ?? null,
    });

    if (!parsed.success) {
      logger.error({ errors: parsed.error.flatten(), raw }, 'Gemini response failed Zod validation');
      return null;
    }

    logger.debug({ result: parsed.data }, 'Gemini transaction parsed');
    return parsed.data;
  } catch (err: any) {
    // Retry once on rate-limit (429)
    if (err?.status === 429 && attempt === 0) {
      const retryAfterMs = _parseRetryDelay(err?.message) ?? 5000;
      logger.warn({ retryAfterMs }, `Gemini rate-limited — retrying after ${retryAfterMs}ms`);
      await new Promise((r) => setTimeout(r, retryAfterMs));
      return _callGemini(text, 1);
    }
    logger.error({ err, text }, 'Gemini API call failed');
    return null;
  }
}

/** Extract retry delay in ms from a 429 error message, e.g. "Please retry in 34.18s" */
function _parseRetryDelay(message?: string): number | null {
  if (!message) return null;
  const match = message.match(/retry in ([0-9.]+)s/);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]) * 1000);
}
