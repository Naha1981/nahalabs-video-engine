# NahaLabs Universal WhatsApp Architecture (Direct / Self-Owned / No Twilio / No Evolution API)

**Role for AI:** You are an expert backend architect building a multi-tenant SaaS with a direct, un-official WhatsApp Web integration. You will **never** use Twilio, Evolution API, 360dialog, or paid WhatsApp Cloud APIs. You will use the "Linked Devices" WebSocket architecture via `@whiskeysockets/baileys`.

---

## 1. The Two-Component Split (Crucial Rule)
Never put the WhatsApp socket connection in the same codebase/host as the serverless frontend.
*   **The Brain (Main App):** Next.js on Vercel (Serverless). Handles UI, Auth (Clerk), Database (Neon/Postgres), Tenant isolation, AI logic, and Webhook receivers.
*   **The Engine (Operator):** Node.js + `@whiskeysockets/baileys` on Render/Docker/Fly.io (Persistent). Holds the 24/7 WebSocket connection to WhatsApp. Survives server restarts.

## 2. The Engine (Operator) Responsibilities
*   **Auth:** Generates QR codes for Linked Devices. Saves the cryptographic session state (`creds`) encrypted into the database (`wa_sessions` table with raw `pg` for `BufferJSON` serialization).
*   **Listening:** Listens to the WhatsApp WebSocket. When a message arrives, it forwards it to the Main App via signed webhook.
*   **Sending:** Exposes a REST API (`POST /send`) so the Main App can tell it to deliver a message.
*   **Health:** Exposes `GET /health` for the Main App and external monitors to check uptime.

## 3. The Handshake (Security & Communication)
*   **Engine to Brain (Inbound):** The Operator `POST`s inbound messages to the Main App's webhook (`/api/webhooks/whatsapp`). **Must be secured with HMAC-SHA256 signatures** (`X-Webhook-Signature`) using `crypto.timingSafeEqual` so the Brain knows the message is authentic and untampered.
*   **Brain to Engine (Outbound):** The Main App sends messages by calling the Operator's REST API. Secured via a shared `OPERATOR_API_KEY` header.

## 4. Multi-Tenancy & Bindings (One Operator for All Apps)
*   Fundamental identity is `wa_account_id` (one connected WhatsApp business number).
*   **INV-1:** ONE live socket per `wa_account_id`, regardless of how many apps/tenants bind to it.
*   **Bindings (`wa_account_bindings`):** Maps `(app_id, tenant_id)` to a `wa_account_id` and webhook URL.
*   The Operator queries the bindings table to fan out or route inbound messages to the correct tenant application.

## 5. Safety, Control & Compliance
*   **Super Admin Master Switch:** A database-backed toggle that instantly kills AI processing globally.
*   **Manual Mode:** A per-tenant toggle. If ON, the system logs messages but the AI is forbidden from auto-replying.
*   **POPIA/GDPR:** The system natively listens for "STOP", "UNSUBSCRIBE", or "OPT-OUT" keywords and instantly adds the sender to a blocklist for that specific tenant.

## 6. The User Flow (Business Activation)
1. Tenant signs up on the Main App.
2. Tenant clicks "Connect WhatsApp". The Main App asks the Operator to create a new socket and returns a QR string.
3. Tenant scans the QR with their physical phone once.
4. Physical phone can now be turned off. The Operator holds the Baileys session 24/7.
5. Customers text the business number. The Operator receives it, signs it, and POSTs to the Brain. The Brain's AI replies via the Operator outbox.
