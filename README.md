# 🛡️ SafeChat — AI-Powered Cyberbullying & Scam Detection Chrome Extension

> Real-time AI protection against cyberbullying, scams, and online harassment with Indian legal awareness.

## Features

- **🔍 Real-time Toxicity Detection** — 7 categories: profanity, threats, harassment, hate speech, sexual harassment, intimidation, manipulation
- **🔗 Scam & Phishing Detection** — Brand impersonation, suspicious URLs, scam patterns, India-specific KYC scams
- **🛑 Outgoing Message Interception** — Warning popup before sending harmful content (Edit / Cancel / Send Anyway)
- **⚖️ Legal Awareness** — Indian IT Act, IPC references with safe phrasing
- **📊 Analytics Dashboard** — Threat stats, charts, and alert history
- **🇮🇳 Reporting** — Direct link to National Cyber Crime Portal (cybercrime.gov.in)

## Supported Platforms

- WhatsApp Web
- Twitter / X
- Instagram Web

## Quick Setup

1. Open `tools/generate-icons.html` in Chrome, right-click each icon → Save to `icons/` folder
2. Go to `chrome://extensions/` → Enable Developer mode
3. Click "Load unpacked" → Select this `safechat/` folder
4. Navigate to WhatsApp Web, Twitter, or Instagram to see it in action

## Test the AI Engines

Open `tools/test-suite.html` in your browser to interactively test the toxicity and scam detection engines.

## Tech Stack

- Chrome Extension (Manifest V3)
- Vanilla HTML, CSS, JavaScript
- Heuristic NLP (pattern matching + weighted scoring)
- Canvas API (dashboard charts)
- No external dependencies or backend required

## License

MIT — Built for hackathon purposes. Legal information is for awareness only, not legal advice.
