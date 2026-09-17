# Browser TTS

A sleek, fast, client-side Text-to-Speech (TTS) web app built with React, TypeScript, Vite, and Tailwind CSS. Powered by the native Web Speech API.

## Features

- 🔊 **In-Browser Speech Synthesis**: Speaks any text using the browser's native Web Speech API (`SpeechSynthesis`).
- 🎙️ **Voice & Audio Controls**: Choose from available system voices and customize speech rate and pitch.
- ✍️ **Text Manipulation Utilities**: Quick actions for UPPERCASE, lowercase, Title Case, whitespace trimming, one-click copy, and clearing.
- 🌓 **Dark & Light Mode**: Clean, responsive GitHub-inspired UI.
- ⚡ **Zero Backend**: 100% client-side with no external API keys or server dependencies required.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **APIs**: Web Speech API (`SpeechSynthesisUtterance`)
- **Package Manager / Runtime**: Bun

## Development

This repo uses Bun.

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Production build
bun run build

# Preview build
bun run preview
```

## Deployment

- Vite builds static files to `dist/`.
- Ready to deploy to Cloudflare Pages:
  ```bash
  bun run cf-deploy
  ```
- Or Firebase Hosting / GitHub Pages (serve `dist/` and rewrite routes to `/index.html`).

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Authors

- [Ved Gupta](https://github.com/innovatorved)

## 🚀 About Me

I'm a Developer i will feel the code then write .

## Support

For support, email vedgupta@protonmail.com
