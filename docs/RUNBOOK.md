# NahaLabs Video Engine - Operational Runbook

**Service:** `nahalabs-video-engine`  
**Standard:** 10/10 Governance Standard

---

## 1. Quick Start & Local Development

```bash
# Install dependencies
npm install

# Run unit and MatrAIx synthetic persona test suite
npm test

# Run strict TypeScript verification
npm run typecheck

# Build for production
npm run build

# Start local production server
npm start
```

---

## 2. Infrastructure Health & Render Keep-Alive Configuration

The system provides standard health check endpoints:

- `GET /api/health` — Primary health check (HTTP 200 JSON with service version and uptime).
- `GET /api/health/live` — Process liveness verification.
- `GET /api/health/ready` — Subsystem readiness check (verifies Brand Brain & Industry Intel catalogs).

### Render Keep-Alive Setup (cron-job.org / External Scheduler)
1. **Target URL:** `https://<YOUR_DEPLOYED_DOMAIN>/api/health`
2. **Method:** `GET`
3. **Schedule:** Every 10 minutes (`*/10 * * * *`)
4. **Header:** `User-Agent: NahaLabs-KeepAlive-Ping/1.0`
5. **Expected Status:** `200 OK`

---

## 3. Webhook Integration & HMAC-SHA256 v2 Verification

Inbound webhooks to `/api/webhooks` must include the cryptographic header:

```http
POST /api/webhooks HTTP/1.1
Host: yourdomain.com
Content-Type: application/json
x-nahalabs-signature: t=1693728000,n=c3f1981a,v2=3b8f62...
x-nahalabs-event: video.rendered

{
  "id": "evt_123",
  "data": { ... }
}
```

---

## 4. Model Context Protocol (MCP) Setup

Connect Claude Desktop, Cursor, or ChatGPT to NahaLabs Video Engine:

```json
{
  "mcpServers": {
    "nahalabs-video-engine": {
      "url": "https://<YOUR_DOMAIN>/api/mcp"
    }
  }
}
```

Exposed MCP Tools:
1. `list_industry_strategies`
2. `get_brand_brain`
3. `create_commercial_video_project`
4. `run_precompose_validation`
5. `run_post_render_review`
6. `calculate_video_cost`
7. `get_system_health`
