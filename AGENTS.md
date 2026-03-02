# CodeForge - Agent Guidelines

## Build & Development Commands

### Root Commands
```bash
npm run dev          # Start both frontend and backend concurrently
npm run build        # Build frontend for production
npm run start        # Start both services for production
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start dev server (opens localhost:9002)
npm run dev:no-open  # Start without auto-opening browser
npm run build        # Production build
npm run lint         # ESLint checks
npm run typecheck    # TypeScript type checking (tsc --noEmit)
```

### Backend Commands
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
```

---

## Code Style Guidelines

### General Principles
- **No comments** unless explicitly required
- **Concise code** - prefer shorter solutions
- **Fail fast** - validate inputs early
- **Consistency** - match existing code patterns

### Frontend (TypeScript/React/Next.js)

#### Imports Order
1. React imports (`react`)
2. Third-party (`firebase/auth`, `@radix-ui/...`, `lucide-react`)
3. Internal (`@/lib/...`, `@/components/...`, `@/contexts/...`)

#### Component Structure
- Client components must start with `'use client'`
- Use TypeScript interfaces for props/context types
- Use `React.forwardRef` for ref forwarding

#### Styling
- Use Tailwind CSS + `cn()` utility for conditional classes
- Use Radix UI primitives for interactive components

#### Error Handling
- Use try/catch with `unknown` type, then narrow
- Always reset loading in `finally` block
- Convert errors to user-friendly messages

#### Naming Conventions
- **Components**: PascalCase (`AuthProvider`, `ChatPanel`)
- **Hooks**: camelCase with `use` prefix (`useAuth`)
- **Interfaces**: PascalCase with `Props` or `Type` suffix
- **Files**: kebab-case (`auth-context.tsx`)

---

### Backend (JavaScript/Node.js)

#### Structure
- Use CommonJS (`require`, not ES modules)
- Group code with section headers

```javascript
// =============================================================================
// Section Header
// =============================================================================

app.post('/api/endpoint', async (req, res) => {
  try {
    const result = await process(req.body);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
```

#### Authentication
- Always use `verifyFirebaseToken` middleware for protected routes
- Check `FIREBASE_INITIALIZED` before auth operations

---

### TypeScript Conventions
- Explicit types for params/returns, infer for locals
- Prefer `as` over angle-bracket; use `unknown` then narrow

---

## File Locations

| Category | Location |
|----------|----------|
| UI Components | `frontend/src/components/ui/` |
| Feature Components | `frontend/src/components/ide/` |
| Context/State | `frontend/src/contexts/` |
| Utilities | `frontend/src/lib/` |
| Backend Routes | `backend/index.js` |

---

## Configuration

- Frontend port: **9002**
- Backend port: **5001** (dynamically allocated if in use)
- Firebase config: `frontend/.env.local`
- Backend service account: `backend/firebase-service-account.json`

---

## Testing

No test framework currently configured. If adding tests:
- **Jest**: `npm test -- --testPathPattern="filename.spec.ts"`
- **Vitest**: `npm test run filename`

---

## Architecture Notes

### Terminal System (`backend/index.js` + `session-context.tsx` + `bottom-panel.tsx`)
- Terminal uses **Socket.IO** events (`terminal_run`, `terminal_kill`, `terminal_output`, `terminal_exit`) for real-time streaming
- **No timeout** — processes run until user kills them via the stop/trash button
- Session files are written to a temp directory (`codeforge-terminal-*`) with **full folder structure** preserved (e.g. `templates/index.html`)
- File paths are reconstructed by walking the `parentId` chain in the frontend before sending to backend
- `killProcessTree()` helper uses `taskkill /F /T /PID` on Windows to kill entire process trees (prevents zombie processes)

### Code Execution / Run Button (`executeCode` in `backend/index.js`)
- The Run button sends `run_code` via Socket.IO with `projectFiles` (all session files with full paths)
- Backend writes all project files to a temp dir (`codeforge-{uuid}`) alongside the main code file (`main.py`, `Main.java`, etc.)
- Has a 30s timeout — not suitable for long-running servers (use Terminal instead)

### Export Feature (`header.tsx`)
- "Build Container Image" dialog uses a **custom portal-based modal** (not Radix UI Dialog) to avoid `pointer-events: none` bug when nested inside DropdownMenu
- `resetBodyPointerEvents()` helper ensures `pointer-events` are always restored on `<body>`
- Export and Build both reconstruct full file paths from `parentId` chain

### Windows Process Management
- **Always use `killProcessTree()`** instead of `child.kill('SIGKILL')` — on Windows, `child.kill()` does NOT kill child processes (e.g. Flask's debug reloader spawns a subprocess that survives)
- `killProcessTree()` is defined at the top of `backend/index.js`

---

## Git & Version Control

- **Never commit secrets**
- **Never use `--force` push
- Create commits describing the "why"
