<div align="center">

# 🏛️ NAHALABS UNIVERSAL SOFTWARE ENGINEERING ARCHITECTURE & VIDEO ENGINE OS
**Version 3.0 — Enterprise Full-Stack · AI-Native · Agentic · Secure · Observable**

[![10/10 Governance](https://img.shields.io/badge/NahaLabs-10%2F10%20Governance-10b981?style=flat-square)](docs/NAHALABS_ENGINEERING_STANDARD.md)
[![WhatsApp ADR-014](https://img.shields.io/badge/WhatsApp-Self%20Owned%20Baileys-25D366?style=flat-square)](WHATSAPP_ARCHITECTURE.md)
[![OpenMontage Architecture](https://img.shields.io/badge/Engine-OpenMontage%20v1.2-6366f1?style=flat-square)](docs/ARCHITECTURE.md)
[![MCP Protocol](https://img.shields.io/badge/MCP-JSON--RPC%202.0-06b6d4?style=flat-square)](docs/RUNBOOK.md)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict%205.7-3178c6?style=flat-square)](tsconfig.json)
[![Next.js](https://img.shields.io/badge/Next.js-15%20App%20Router-black?style=flat-square)](package.json)

**The Reusable Master Repository & Software Engineering Constitution for NahaLabs Enterprise Apps (Banks, Government, Insurance, Mining, Private Sector, Vodacom, etc.)**

</div>

---

## 🌟 What This Repository Is

This repository serves as **NahaLabs' Universal Software Engineering OS and Reusable Master Repository**. Whenever we start building any software application—small or enterprise-grade—we clone or initialize from this repository.

It integrates:
1. **NahaLabs Universal Engineering Constitution V3.0** (Enterprise lifecycle, security architecture, RLS tenant isolation, multi-tenancy, and AI governance).
2. **Self-Owned WhatsApp Infrastructure Skill (ADR-014)** (Zero Twilio, zero Evolution API, 2-Server Baileys Model, HMAC v2 webhooks, multi-tenant bindings, and outbox durability).
3. **OpenMontage Video Production Engine** (Fullstack commercial video SaaS with Brand Brain governance and automated 6-point post-render self-review).
4. **MatrAIx Synthetic QA Persona Testing** (Autonomous UI verification and auto-regression).
5. **Activepieces & Resend Integration Standards** (Serverless workflows and transactional email).
6. **Universal MCP & WebMCP Gateway** (Agent-ready tool exposure for ChatGPT, Claude, Cursor, and Make/Zapier).

---

## 🏗️ Repository Structure

```text
/
├── docs/
│   ├── NAHALABS_ENGINEERING_STANDARD.md  # Master Engineering Constitution (V3.0)
│   ├── ARCHITECTURE.md                   # Video Engine & Enterprise Architecture Blueprint
│   ├── GROWTH_OS.md                      # Autonomous Growth Engine Spec
│   ├── SECURITY.md                       # 20-Point Pre-Launch Security Checklist
│   └── RUNBOOK.md                        # Operational Runbook
├── operator/                             # Stateful WhatsApp Baileys Operator (Render Docker)
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── server.js                     # Express API + HMAC v2 signing
│       ├── db/client.js                  # Raw pg wa_sessions & bindings
│       ├── whatsapp/index.js             # Baileys multi-account socket manager
│       └── webhook/forward.js            # HMAC-signed webhook dispatcher
├── src/                                  # Next.js 15 App Router Core Application
│   ├── app/                              # Pages, API Routes, MCP Gateway, System Health
│   ├── components/                       # Timeline Player, Scene Editor, Layout
│   └── lib/                              # Engine core, Growth OS, Integrations (Resend, HMAC, MCP)
├── WHATSAPP_ARCHITECTURE.md              # Standalone Baileys Operator Guide
├── MATRAIX_SYNTHETIC_QA.md               # Synthetic QA Persona 8B Spec
└── package.json
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit & MatrAIx synthetic persona test suite
npm test

# 3. Typecheck
npm run typecheck

# 4. Build for production
npm run build

# 5. Start production server
npm start
```

---

## 🏛️ Governance & Quality Gate Standard

Built under the **NahaLabs 10/10 AI Governance Standard**:
1. **Archaeology Before Action**
2. **Bounded Gates**
3. **Fail-Closed Security**
4. **Deterministic First, AI Last**
5. **No "Looks Good" Deployments** (Mathematical evidence: 10/10 tests passing, 0 TypeScript errors).

---

© 2026 NahaLabs Enterprise Systems. All rights reserved.
