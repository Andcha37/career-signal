# Career Signal — Live Research

A privacy-conscious, static GitHub Pages app for researching worldwide career-related public information **at the time you click Research**.

## Live source federation

- **GDELT Global News**: worldwide publicly indexed news headlines, source/date/link.
- **Hacker News / Algolia**: public technology and industry discussion posts.
- **Crossref**: scholarly publications and research metadata.

Search runs from the user's browser when they click **Research**. There is **no scheduled news crawler**, no precollected JSON news index, no operator-paid search/LLM API, and no operator-owned credentials in the application.

The system searches only these publicly exposed indexes. It **cannot search literally all information on the internet**, private/paywalled resources, or every career posting. Browser CORS restrictions and public service rate limits may block some sources. Any such errors are reported in the interface.

## Inputs / flow

- Select between **26 fields / 215 jobs** or enter comma-separated **keywords**.
- Pick an end date; the beginning is one calendar month earlier.
- Click **Research**. A bounded set of live queries is sent to search providers; a search of all 215 occupations uses a representative subsample, explicitly disclosed.
- Matching public article and research metadata appears as linked sources first.
- Then a client-side WebLLM model is downloaded if WebGPU works and summarizes the collected **titles and metadata**. If not, a rules-based briefing is shown.
- Copy report with source URLs.

## Privacy and security

- No sign-in or proprietary API key required.
- Search terms and visitor IP addresses **are revealed to the contacted search services** when the browser requests them. No absolute anonymity or no-external-disclosure guarantee is implied.
- Browser model weights may be downloaded from Hugging Face or related content delivery endpoints; model inference is local.
- Article titles are untrusted data. External links open with `noopener noreferrer`.
- The operator GitHub username, repository contents, and commit history remain public.
- GitHub Pages static hosting incurs no operator AI inference billing, subject to free service limits and GitHub's applicable terms.

## Deployment

Repository **Andcha37/career-signal** → Settings → Pages → Build and deployment → GitHub Actions.

Updates pushed to `main` are published by `.github/workflows/pages.yml`. The last build result appears under Actions.

## Limitations

This is **an on-demand federated public-index researcher, not a full unrestricted web search engine**. It does not fetch full article content, does not verify paywalled coverage, cannot guarantee any specific public search API is reachable through CORS, and cannot infer actual company hiring numbers from headlines.
