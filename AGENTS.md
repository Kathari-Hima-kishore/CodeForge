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
npm run lint         # ESLint checks (uses next lint)
npm run typecheck    # TypeScript type checking (tsc --noEmit)
npm run lint && npm run typecheck  # Run both
```

### Running a Single Test
No test framework currently configured. If adding tests:
- **Vitest**: `npm install -D vitest`, then `npm test run filename.spec.ts`
- **Jest**: `npm test -- --testPathPattern="filename.spec.ts"`

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

#### Imports Order (strict order)
1. React imports (`react`)
2. Third-party (`firebase/auth`, `@radix-ui/...`, `lucide-react`, `socket.io-client`)
3. Internal (`@/lib/...`, `@/components/...`, `@/contexts/...`)
4. Type imports (`import type { ... }`)

#### Component Structure
```tsx
'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

interface ComponentProps { title: string; onSubmit: (data: string) => void; }

export function Component({ title, onSubmit }: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleClick = useCallback(async () => {
    setLoading(true);
    try { await doSomething(); } 
    catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, []);

  return <Button onClick={handleClick}>{title}</Button>;
}
```

#### State Management
- Use `useState` for simple local state
- Use `useCallback` for functions passed as props (prevents re-renders)
- Use `useMemo` for expensive computations
- Context: Use `useContext` at component level, not destructured

#### Error Handling
- Use try/catch with `finally` to always reset loading state
- Convert errors: `const error = e as Error; setError(error.message)`
- Example:
```tsx
try { await riskyOperation(); } 
catch (e) { setError((e as Error).message || 'Something went wrong'); } 
finally { setLoading(false); }
```

#### Styling
- Use Tailwind CSS + `cn()` utility (`tailwind-merge` + `clsx`)
- Use Radix UI primitives for interactive components
- Custom modals must use portal to avoid z-index/pointer-events issues

#### Naming Conventions
- **Components**: PascalCase (`AuthProvider`, `ChatPanel`)
- **Hooks**: camelCase with `use` prefix (`useAuth`, `useSession`)
- **Interfaces**: PascalCase with `Props` or `Type` suffix
- **Files**: kebab-case (`auth-context.tsx`)

---

### Backend (JavaScript/Node.js)

#### Structure
- Use CommonJS (`require`, not ES modules)
- Group code with section headers using `// ==== Title ====` format

```javascript
// =============================================================================
// Section: Routes
// =============================================================================
app.post('/api/endpoint', async (req, res) => {
  try {
    const result = await process(req.body);
    res.json(result);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
```

#### Socket.IO Patterns
```javascript
io.on('connection', (socket) => {
  socket.on('event_name', async (data) => {
    try {
      const result = await process(data);
      socket.emit('event_response', result);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });
});
```

#### Authentication
- Always use `verifyFirebaseToken` middleware for protected routes
- Check `FIREBASE_INITIALIZED` before auth operations

---

### TypeScript Conventions
- Explicit types for params/returns, infer for local variables
- Prefer `as` over angle-bracket: `value as Type`
- Use `unknown` then narrow: `catch (e) { const err = e as Error; }`

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

## Architecture Notes

### Terminal System
- Uses Socket.IO (`terminal_run`, `terminal_kill`, `terminal_output`, `terminal_exit`) for real-time streaming
- **No timeout** — processes run until user explicitly kills them
- Session files written to temp dir (`codeforge-terminal-*`) with full folder structure
- File paths reconstructed via `parentId` chain using `getFilePath()` helper

### Code Execution (Run Button)
- Sends `run_code` via Socket.IO with `projectFiles` (all session files)
- Backend writes all files to temp dir alongside main code file (`main.py`, `Main.java`, etc.)
- 30s timeout — not suitable for long-running servers (use Terminal instead)

### Export/Build Feature
- "Build Container Image" dialog uses modal (not custom portal-based Radix UI Dialog)
- `resetBodyPointerEvents()` safety net ensures `pointer-events` restored on `<body>`
- Docker image builds auto-detect framework: Flask (port 5000), FastAPI (8000), Express/Node.js (3000)
- Image names use format: `codeforge/<name>:<timestamp>-<random>` for uniqueness
- Backend auto-generates `requirements.txt` or `package.json` if missing (detects Flask, FastAPI, Express, Django, etc.)
- Always use `detectedPort` variable in Dockerfile templates (not `${port}` - that's a bug)

### Docker Hub Deployment
- When user selects Docker Hub in Export, they enter username/email + password
- Click "Fetch Repositories" button to fetch existing repos from Docker Hub
- API endpoint `GET /api/dockerhub/repos` authenticates with Docker Hub (supports username or email)
- Returns actual Docker Hub username and list of user's repositories
- User can select existing repo from dropdown OR enter custom repo name
- Backend accepts `dockerHubRepo` param in build request to specify target repository
- If selected repo doesn't exist, backend attempts to create it automatically

### Windows Process Management
- **Always use `killProcessTree(child)`** instead of `child.kill()`
- On Windows: `taskkill /F /T /PID` kills entire process tree
- Defined at top of `backend/index.js`, used for all process termination

---

## Debugging Tips

### Frontend
- Check browser console for React warnings
- Use React DevTools for component state inspection
- Network tab for Socket.IO connection status

### Backend
- Check terminal output for runtime errors
- Socket.IO events visible in Network tab (filter by "socket.io")

---

## Git & Version Control

- **Never commit secrets** (.env, credentials, keys)
- **Never use `--force` push
- Create commits describing the "why" not the "what"
- Verify lint/typecheck pass before committing
