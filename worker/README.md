# News API (no RSS, no web scraping)

Career Signal's Cloudflare Worker connects only to the documented JSON endpoint of **GNews API**. Google News RSS and Bing News RSS have been completely removed from executable code.

## Safety-first default
The API is disabled unless BOTH Cloudflare Worker secrets are configured:
- `GNEWS_API_KEY`: GNews credential (use **Worker Secrets**, never GitHub, Pages or browser code)
- `GNEWS_USAGE_APPROVED`: the literal value `true`, **only after** independently confirming that your GNews subscription permits the planned publicly accessible AI-assisted news research service and display/summarization of returned metadata.

Until then, `/search` responds `503 NEWS_API_NOT_ENABLED`. This is deliberate. No requests go to the upstream service without approval.

## Cloudflare GitHub deployment
The repo is already configured via `wrangler.toml`. The active Worker should report version `2026-10-28-licensed-api-v3` at `/health` once the deployment finishes. You do not need to share passwords or API keys in chat.

## Provider rights and costs
The GNews Free plan is not assumed to allow production usage. An official API is **not automatically permission to republish or commercially exploit third-party article material**. Confirm exact subscription contract, commercial/public use, AI processing, permitted attribution, retention, display and redistribution. Paid plans may incur fees; do not activate them to preserve a zero-cost constraint.

Provider API docs: https://docs.gnews.io/endpoints/search-endpoint
Authentication: https://docs.gnews.io/authentication

The browser sends a user-initiated query to your Worker; Cloudflare and the provider may process request metadata. News APIs return metadata, not independently verified full article content.
