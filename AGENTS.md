# CodeForge - Agent Guidelines

## Build & Development Commands

### Root Commands
```bash
npm run dev          # Start both frontend and backend
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

### Running Tests
No test framework currently configured. If added:
```bash
# Jest: npm test -- --testPathPattern="filename.spec.ts"
# Vitest: npm test run filename
```

---

## Code Style Guidelines

### General Principles
- **No comments** unless explicitly required
- **Concise code** - prefer shorter solutions
- **Fail fast** - validate inputs early
- **Consistency** - match existing code patterns

---

### Frontend (TypeScript/React/Next.js)

#### Imports Order
1. React imports (`react`)
2. Third-party (`firebase/auth`, `@radix-ui/...`, `lucide-react`)
3. Internal (`@/lib/...`, `@/components/...`, `@/contexts/...`)

```typescript
// ✅ Correct
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

// ❌ Wrong
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
```

#### Component Structure
- Client components must start with `'use client'`
- Use TypeScript interfaces for props/context types
- Use `React.forwardRef` for ref forwarding

```typescript
'use client';
import { useState } from 'react';

interface Props { title: string; onSubmit: (v: string) => void; }

export function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState('');
  return <div><h1>{title}</h1></div>;
}
```

#### Styling
- Use Tailwind CSS + `cn()` utility for conditional classes
- Use Radix UI primitives for interactive components

```typescript
<div className={cn("base", isActive && "active", className)} />
```

#### Error Handling
- Use try/catch with `unknown` type, then narrow
- Always reset loading in `finally` block
- Convert errors to user-friendly messages

```typescript
try {
  setLoading(true);
  await doSomething();
} catch (err: unknown) {
  const error = err as { code?: string };
  if (error.code === 'auth/invalid-credential') {
    throw new Error('Invalid credentials');
  }
  throw err;
} finally {
  setLoading(false);
}
```

#### Naming Conventions
- **Components**: PascalCase (`AuthProvider`, `ChatPanel`)
- **Hooks**: camelCase with `use` prefix (`useAuth`)
- **Interfaces**: PascalCase with `Props` suffix
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

```typescript
function greet(name: string): string {
  const msg = `Hello, ${name}`;  // inferred
  return msg;
}

catch (err: unknown) {
  const error = err as { code?: string };
}
```

---

### File Locations

| Category | Location |
|----------|----------|
| UI Components | `frontend/src/components/ui/` |
| Feature Components | `frontend/src/components/ide/` |
| Context/State | `frontend/src/contexts/` |
| Utilities | `frontend/src/lib/` |
| Backend Routes | `backend/index.js` |

---

### Configuration
- Frontend port: **9002**
- Backend port: **5001** (dynamically allocated if in use)
- Firebase config: `frontend/.env.local`
- Backend service account: `backend/firebase-service-account.json`

---

### Git & Version Control
- **Never commit secrets**
- **Never use `--force` push**
- Create commits describing the "why"
