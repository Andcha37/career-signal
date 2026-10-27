# Career Signal
Privacy-first, zero owner AI API billing job-sector news research app.

## Features
26 career families / 215 jobs, manual keyword search, one-month period, news list before local AI essay, references, export.

## Deployment
Enable GitHub Pages -> Build and deployment -> **GitHub Actions**. Run **Refresh public news index** from Actions.
CI builds and publishes this static website with no commercial LLM API credentials.
Initial news index is empty. Data coverage is explicitly limited to collected public headlines; this is NOT a complete worldwide web search.
No login or private account information needed. The GitHub repository owner and commit history remain publicly visible.

## Security
Never put API keys in source. No user data is sent to a model provider by the app, but article links opened by users will contact those publishers. WebLLM may download model weights from a third party. All local model analysis happens after Research is clicked. User research preferences remain local.
