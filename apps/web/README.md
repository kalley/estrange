# estrange Web App

Browser-based daily creative disruption. No installation, no signup, just immediate creative disruption.

## Getting Started

Visit [estrange.app](https://estrange.app) and start receiving daily creative prompts immediately.

## Features

- **Instant access:** No installation or account creation required
- **Local storage:** Your creative journey stays in your browser
- **Daily rhythm:** One prompt per day, consistent creative disruption
- **Response tracking:** Build a personal archive of creative responses
- **Pattern analysis:** Review your creative evolution over time
- **Export capability:** Own your data, move it anywhere

## Browser Compatibility

Estrange web app works in all modern browsers:
- Chrome/Chromium 88+
- Firefox 84+
- Safari 14+
- Edge 88+

## Data & Privacy

- **Local-first:** All data stored in your browser's local storage
- **No tracking:** Zero analytics, cookies, or user tracking
- **No accounts:** No signups, passwords, or personal information
- **Exportable:** Download your complete creative journey anytime
- **Portable:** Import/export between devices and browsers

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
cd apps/web
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview  # Test the production build
```

### Tech Stack
- **Framework:** [Your framework choice - React/Vue/Svelte/etc]
- **Build tool:** Vite
- **Styling:** [Your styling approach]
- **Storage:** Browser LocalStorage API

## Deployment

The web app is designed to be deployed anywhere:
- **Static hosting:** Netlify, Vercel, GitHub Pages
- **CDN:** Any CDN that serves static files
- **Self-hosted:** Any web server

No server-side code or database required.

## Browser Storage Details

**Storage location:** Browser's LocalStorage under the estrange domain
**Storage format:** JSON structure matching CLI export format
**Storage limits:** Typically 5-10MB per domain (browser dependent)
**Backup strategy:** Regular exports recommended

### Exporting Your Data
Use the export function to download a complete JSON file of your creative journey. This file can be:
- Imported into the CLI version
- Analyzed with your favorite tools
- Backed up for safekeeping
- Shared with LLMs for pattern analysis

## Future Web Features

Ideas in development:
- **Sync options:** Optional cloud sync for multi-device access
- **Visual timeline:** Graphical view of your creative journey
- **Response themes:** Categorize and tag your creative responses
- **Sharing:** Optional anonymous sharing of interesting prompts/responses
- **Mobile PWA:** Install as a mobile app

## Troubleshooting

**Lost your responses?**
- Check if you're in the same browser/domain
- Look for exported backup files
- IndexedDB data persists better than LocalStorage but can still be cleared

**Not getting new prompts?**
- Check your browser's date/time settings
- Try refreshing the page
- Clear browser cache if needed

**Export not working?**
- Ensure popup blockers aren't interfering
- Try a different browser
- Check available disk space

## Back to Main Documentation
See the [main README](../../README.md) for philosophy, examples, and general information about estrange.
