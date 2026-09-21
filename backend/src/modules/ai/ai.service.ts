import Groq from 'groq-sdk';
import { z } from 'zod';
import { config } from '../../config';
import { logger } from '../../shared/logger';

// ── Groq client ────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: config.GROQ_API_KEY });

const TEXT_MODEL = 'openai/gpt-oss-20b';
const VISION_MODEL = 'qwen/qwen3.8-27b';

// ── Zod schema for validated AI output ───────────────────────────────────────
export const ParsedTransactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer', 'loan', 'investment', 'subscription', 'unknown']),
  amount: z.number().nullable(),
  currency: z.string().default('INR'),
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  paymentMethod: z.string().nullable(),
  notes: z.string().nullable(),
});

export const ParsedMessageSchema = z.object({
  isFinancial: z.boolean(),
  transactions: z.array(ParsedTransactionSchema).default([]),
});

export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;
export type ParsedMessage = z.infer<typeof ParsedMessageSchema>;

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a financial transaction parser for an Indian personal finance app.
Your job is to extract structured transaction data from natural language messages in English, Hindi, or Hinglish.

Rules:
- Default currency is INR (Indian Rupees). ₹, rs, rupe, rupees all mean INR.
- If the message is NOT about a financial transaction (e.g. greetings, questions, random text), set isFinancial to false and transactions to an empty array.
- If the user provides split expenses (e.g., "spent 500 total, 300 on food and 200 on cab"), extract EACH split as a SEPARATE transaction in the array. Ignore the total if you have the splits.
- For type: use "expense" for spending/payment, "income" for receiving money/salary, "transfer" for sending to someone, "loan" for lending/borrowing, "investment" for stocks/mutual funds, "subscription" for recurring services.
- Infer category from context: Food, Transport, Shopping, Entertainment, Health, Utilities, Rent, Salary, Investment, Subscription, Other.
- paymentMethod options: cash, upi, card, netbanking, or null if unknown.
- Always return valid JSON matching the schema exactly. No markdown, no explanation.`;

// ── Groq tool calling schema ────────────────────────────────────────────
const extractTransactionTool = {
  type: 'function' as const,
  function: {
    name: 'extract_transactions',
    description: 'Extract one or more structured financial transaction data from a natural language message',
    parameters: {
      type: 'object',
      properties: {
        isFinancial: {
          type: 'boolean',
          description: 'Whether the message is about financial transactions',
        },
        transactions: {
          type: 'array',
          description: 'List of transactions found in the message',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['expense', 'income', 'transfer', 'loan', 'investment', 'subscription', 'unknown'],
                description: 'Type of transaction',
              },
              amount: {
                type: 'number',
                description: 'Transaction amount as a number',
              },
              currency: {
                type: 'string',
                description: 'Currency code, default INR',
              },
              merchant: {
                type: 'string',
                description: 'Merchant or person name, or empty string',
              },
              category: {
                type: 'string',
                description: 'Category: Food, Transport, Shopping, Entertainment, Health, Utilities, Rent, Salary, Investment, Subscription, Other, or empty string',
              },
              paymentMethod: {
                type: 'string',
                description: 'Payment method: cash, upi, card, netbanking, or empty string',
              },
              notes: {
                type: 'string',
                description: 'Any additional notes from the message, or empty string',
              },
            },
            required: ['type', 'amount', 'currency'],
          },
        },
      },
      required: ['isFinancial', 'transactions'],
    },
  },
};

/**
 * Parse a natural language message and extract transaction data using Groq.
 * Returns null if the message is not financial or parsing fails.
 * Retries once with backoff on 429 rate-limit errors.
 */
export async function parseTransaction(text: string): Promise<ParsedMessage | null> {
  return _callGroq(text, 0);
}

/**
 * Parse a receipt image and extract transaction data using Groq Vision.
 */
export async function parseReceiptImage(base64Image: string, mimeType: string): Promise<ParsedMessage | null> {
  return _callGroqWithImage(base64Image, mimeType, 0);
}

async function _callGroq(text: string, attempt: number): Promise<ParsedMessage | null> {
  try {
    const response = await groq.chat.completions.create({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Message: "${text}"` }
      ],
      tools: [extractTransactionTool],
      tool_choice: { type: 'function', function: { name: 'extract_transactions' } },
      temperature: 0,
    });

    const toolCall = response.choices[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      logger.warn({ text }, 'Groq returned no function call — not a financial message');
      return null;
    }

    const raw = JSON.parse(toolCall.function.arguments);

    const mappedTransactions = (raw.transactions || []).map((t: any) => ({
      ...t,
      amount: t.amount ?? null,
      merchant: t.merchant ?? null,
      category: t.category ?? null,
      paymentMethod: t.paymentMethod ?? null,
      notes: t.notes ?? null,
    }));

    const parsed = ParsedMessageSchema.safeParse({
      isFinancial: raw.isFinancial ?? false,
      transactions: mappedTransactions,
    });

    if (!parsed.success) {
      logger.error({ errors: parsed.error.flatten(), raw }, 'Groq response failed Zod validation');
      return null;
    }

    logger.debug({ result: parsed.data }, 'Groq transaction parsed');
    return parsed.data;
  } catch (err: any) {
    if (err?.status === 429 && attempt === 0) {
      const retryAfterMs = _parseRetryDelay(err) ?? 5000;
      logger.warn({ retryAfterMs }, `Groq rate-limited — retrying after ${retryAfterMs}ms`);
      await new Promise((r) => setTimeout(r, retryAfterMs));
      return _callGroq(text, 1);
    }
    logger.error({ err, text }, 'Groq API call failed');
    return null;
  }
}

async function _callGroqWithImage(base64Image: string, mimeType: string, attempt: number): Promise<ParsedMessage | null> {
  try {
    const response = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\nPlease return a JSON object exactly matching the schema. Start with { and end with }.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Parse the transactions from this receipt/bill image.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      logger.warn('Groq returned no content for receipt image');
      return null;
    }

    const raw = JSON.parse(content);

    const mappedTransactions = (raw.transactions || []).map((t: any) => ({
      ...t,
      amount: t.amount ?? null,
      merchant: t.merchant ?? null,
      category: t.category ?? null,
      paymentMethod: t.paymentMethod ?? null,
      notes: t.notes ?? null,
    }));

    const parsed = ParsedMessageSchema.safeParse({
      isFinancial: raw.isFinancial ?? false,
      transactions: mappedTransactions,
    });

    if (!parsed.success) {
      logger.error({ errors: parsed.error.flatten(), raw }, 'Groq response failed Zod validation (Image)');
      return null;
    }

    logger.debug({ result: parsed.data }, 'Groq receipt parsed');
    return parsed.data;
  } catch (err: any) {
    if (err?.status === 429 && attempt === 0) {
      const retryAfterMs = _parseRetryDelay(err) ?? 5000;
      await new Promise((r) => setTimeout(r, retryAfterMs));
      return _callGroqWithImage(base64Image, mimeType, 1);
    }
    logger.error({ err }, 'Groq API call with image failed');
    return null;
  }
}

function _parseRetryDelay(err: any): number | null {
  const retryHeader = err?.response?.headers?.['retry-after'];
  if (retryHeader) {
    return Math.ceil(parseFloat(retryHeader) * 1000);
  }
  return null;
}
