/**
 * MessagingPlatformClient — the ONLY way Core business code talks to the Operator.
 * Copy into src/lib/messaging/platform-client.ts.
 *
 * Business code calls `sendMessage(...)` via this typed client; it NEVER imports Baileys
 * or any transport internals. Swapping Baileys → official WhatsApp Cloud API later means
 * changing this one file, not your business logic.
 */
import { z } from 'zod';
import type { SendMessageInput, SendResult } from './types';

const sendInputSchema = z.object({
  waAccountId: z.string().uuid(),
  to: z.string().min(1).max(64),
  text: z.string().min(1).max(4096),
});

const sendResponseSchema = z.object({
  sent: z.boolean(),
  result: z.object({ key: z.object({ id: z.string() }).optional() }).optional(),
});

const qrResponseSchema = z.object({ qr: z.string() });

const statusResponseSchema = z.object({
  waAccountId: z.string(),
  isConnected: z.boolean(),
  phoneNumber: z.string().nullable(),
});

export class MessagingPlatformError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'MessagingPlatformError';
  }
}

export interface MessagingPlatformClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class MessagingPlatformClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MessagingPlatformClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init: RequestInit = {}, schema?: z.ZodType<T>): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });

      const text = await res.text();
      let body: unknown = null;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        const code = (body as { code?: string } | null)?.code ?? `HTTP_${res.status}`;
        const message = (body as { error?: string } | null)?.error ?? `Operator returned HTTP ${res.status}`;
        throw new MessagingPlatformError(res.status, code, message);
      }

      return schema ? schema.parse(body) : (body as T);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Deliver a message. Returns the Operator-side message id when known. */
  async send(input: SendMessageInput): Promise<SendResult> {
    sendInputSchema.parse(input);
    const res = await this.request<z.infer<typeof sendResponseSchema>>(
      '/send',
      { method: 'POST', body: JSON.stringify(input) },
      sendResponseSchema,
    );
    return { messageId: res.result?.key?.id ?? null };
  }

  /** Begin QR pairing for a WhatsApp account (owner scans the QR once). */
  async pair(waAccountId: string): Promise<void> {
    await this.request(`/accounts/${waAccountId}/pair`, { method: 'POST' });
  }

  /** Fetch the ephemeral pairing QR. Returns null when it has expired. */
  async pairingQr(waAccountId: string): Promise<string | null> {
    try {
      const res = await this.request<z.infer<typeof qrResponseSchema>>(
        `/accounts/${waAccountId}/qr`,
        undefined,
        qrResponseSchema,
      );
      return res.qr;
    } catch (err) {
      if (err instanceof MessagingPlatformError && err.status === 410) return null;
      throw err;
    }
  }

  async status(waAccountId: string): Promise<z.infer<typeof statusResponseSchema>> {
    return this.request(`/accounts/${waAccountId}/status`, undefined, statusResponseSchema);
  }

  async disconnect(waAccountId: string): Promise<void> {
    await this.request(`/accounts/${waAccountId}/disconnect`, { method: 'POST' });
  }
}

/**
 * Lazy singleton bound to env vars. Never construct with a secret in client-side code —
 * this module is server-only.
 */
let defaultClient: MessagingPlatformClient | null = null;

export function getMessagingClient(): MessagingPlatformClient {
  if (!defaultClient) {
    const baseUrl = process.env.OPERATOR_URL;
    const apiKey = process.env.OPERATOR_API_KEY;
    if (!baseUrl || !apiKey) {
      throw new Error('Messaging platform not configured: OPERATOR_URL / OPERATOR_API_KEY missing');
    }
    defaultClient = new MessagingPlatformClient({ baseUrl, apiKey });
  }
  return defaultClient;
}

/** Convenience wrapper — this is what business code calls. */
export async function sendMessage(input: SendMessageInput): Promise<SendResult> {
  return getMessagingClient().send(input);
}
