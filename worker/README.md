# Google News + optional Naver News gateway

The GitHub Pages frontend cannot directly fetch Google News RSS because of cross-origin browser restrictions. This Cloudflare Worker is a bounded read-only news proxy.

## Free deployment (manual one-time step)

1. Create a **Cloudflare Workers Free** account, without enabling a paid plan. Name a Worker `career-signal-news`.
2. Replace its source with `worker/news-gateway.js`. Use the Worker editor's **Deploy** action.
3. Copy the resulting Worker URL, such as `https://career-signal-news.<your-subdomain>.workers.dev`.
4. Edit `src/config.js` in this repository and set `NEWS_GATEWAY_URL` to that exact base URL. Never enter a secret or an account token in GitHub source files.
5. Wait for the GitHub Pages deployment to complete. Test the Worker `/health` endpoint and then search for `현대자동차` in the website.

Google News requires **no credential**. Naver News is optional and uses an official developer application's `NAVER_CLIENT_ID` and `NAVER_CLIENT_SECRET`, configured only as **Worker Secrets**, never exposed to GitHub/browser. Naver search API quotas/terms apply. Do not enable paid services if strict zero billing is required.

Worker source only accepts fixed /search and /health paths, limited dates and bounded search lengths, never user-supplied upstream URLs. Google RSS content may vary or be unavailable. The Worker public endpoint can still be accessed directly despite an Origin allowlist; that is not reliable abuse prevention. Cloudflare and public search providers can see visitor IP and submitted search words. No exhaustive web coverage is implied.

**Ambiguous companies:** `현대` may refer to 현대자동차, 현대건설, 현대해상, 현대백화점 and others. For accurate results enter the specific legal company name and its English name. Current search uses title-based company mention filtering and can still omit relevant articles.
