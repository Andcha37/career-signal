# Career Signal — Evidence-based career research

On-demand public career/company/keyword research with a browser-local WebLLM report.

## News retrieval (rights first)

- No Google News RSS, Bing News RSS, News portal scraping, or feed parsing.
- A Cloudflare Worker supports the **official GNews JSON API** as an opt-in provider; it is **disabled by default**.
- To enable it, confirm your provider contract allows this public-facing use, then store `GNEWS_API_KEY` and `GNEWS_USAGE_APPROVED=true` as Cloudflare Worker Secrets. **Never commit or share credentials.**
- The public site does not store the provider key. The GNews free subscription must not be presumed to authorize publicly deployed services.
- See [worker/README.md](worker/README.md) for provider contract and deployment details.

## Other research data

Research modes: company, occupations and keywords. Besides licensed news, career/academic metadata can be searched through public API integrations (GDELT, Hacker News, Crossref, OpenAlex), subject to their provider conditions, technical limits and availability. Titles are not article bodies. The local AI analyzes fetched evidence after an explicit Research click; with no available evidence it does not invent a report.

## Deployment

GitHub Pages serves static app. Cloudflare Worker provides a rights-gated server-side news API integration. Operator may incur third-party charges if knowingly activating paid subscriptions. Never place secrets in static web assets.
