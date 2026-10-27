# Google News gateway

Career Signal uses Google News RSS in Korean and English through a Cloudflare Worker, because browser requests to RSS are constrained by CORS. No search API keys or credentials are required.

## Deployment
1. Create a Cloudflare Workers **Free** account and a Worker named `career-signal-news`; do not upgrade to a paid tier.
2. Paste [the Worker source](news-gateway.js) into its editor and click Deploy.
3. Copy the worker's base URL, e.g. `https://career-signal-news.<subdomain>.workers.dev`.
4. Set `NEWS_GATEWAY_URL` in [src/config.js](../src/config.js) to that base URL, commit and allow Pages to publish.
5. Verify `/health`, then search a company on the website.

The Worker searches Google News KR and EN and extracts public article headline metadata. It does **not** retrieve article bodies. Google News RSS can change or become unavailable, and Google/Cloudflare can observe user search terms and IP addresses. The public Worker endpoint is not abuse-proof; Origin restrictions alone are not authentication. The operator GitHub username is public.
