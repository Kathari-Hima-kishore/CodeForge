# CodeForge Frontend

Next.js 15 application for the CodeForge collaborative IDE.

## Getting Started

```bash
npm install
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 9002) |
| `npm run build` | Production build |
| `npm run lint` | ESLint checks |
| `npm run typecheck` | TypeScript validation |

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js pages |
| `src/components/ide/` | IDE components (editor, terminal, file explorer) |
| `src/components/ui/` | Reusable UI components |
| `src/components/session/` | Session management |
| `src/contexts/` | React contexts |
| `src/lib/` | Utilities |

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS
- Radix UI
- Socket.IO Client
- Firebase Auth
