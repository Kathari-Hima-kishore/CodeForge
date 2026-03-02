# CodeForge - Current Context & Status

## Recent Changes (2026-03-02)

### 1. Export Feature UI Freeze Fix ✅
- **Problem**: Opening/closing "Build Container Image" dialog froze the UI (`pointer-events: none` stuck on `<body>`)
- **Root Cause**: Radix UI `<Dialog modal>` nested inside `<DropdownMenu>` fails to clean up pointer events
- **Fix**: Replaced with custom portal-based modal in `header.tsx`, added `resetBodyPointerEvents()` safety net
- **Files**: `frontend/src/components/ide/header.tsx`

### 2. Terminal Rewrite — Socket.IO Streaming ✅
- **Problem**: Terminal used HTTP request-response (couldn't stream output), had 30s timeout killing long-running servers
- **Fix**: Rewrote to use Socket.IO events for real-time streaming, no timeout, explicit kill via UI buttons
- **Files**: 
  - `backend/index.js` — `terminal_run`, `terminal_kill` socket events
  - `frontend/src/contexts/session-context.tsx` — `sendTerminalCommand`, `killTerminal`, `isTerminalRunning`
  - `frontend/src/components/ide/bottom-panel.tsx` — Stop button, trash kills process

### 3. Session Files Written to Disk ✅
- **Problem**: Terminal commands couldn't access user files (`python untitled.py` → "No such file")
- **Fix**: Frontend collects all session files with full paths (reconstructed via `parentId` chain), sends them with the command; backend writes them to a temp project directory
- **Files**: `session-context.tsx`, `backend/index.js`

### 4. Folder Structure Preservation ✅
- **Problem**: Files inside folders (e.g. `templates/index.html`) were written flat to disk
- **Fix**: Added `getFilePath()` helper that walks `parentId` chain to build paths like `templates/index.html`
- **Applied to**: Terminal, Run button (`executeCode`), Export Source Code, Build Container

### 5. Run Button Multi-File Support ✅
- **Problem**: `executeCode` only wrote the single code file (as `main.py`), not other project files
- **Fix**: Frontend sends `projectFiles` with `run_code` socket event; backend writes all files to temp dir
- **Files**: `session-context.tsx` (added `files` to `useCallback` deps), `backend/index.js`

### 6. Windows Process Tree Killing ✅
- **Problem**: `child.kill('SIGKILL')` doesn't kill child processes on Windows → Flask debug reloader spawns zombie processes that hold ports forever
- **Fix**: Added `killProcessTree()` helper using `taskkill /F /T /PID` on Windows; replaced ALL kill calls
- **Files**: `backend/index.js` (top of file)

### 7. EBUSY Temp Dir Cleanup ✅
- **Problem**: `fs.rmSync` failed with EBUSY after killing processes (file handles still locked)
- **Fix**: Retry logic with delays in `executeCode`'s `finally` block
- **Files**: `backend/index.js`

### 8. Flask `TemplateNotFound` Error ✅
- **Problem**: Running a Flask app that uses `render_template('index.html')` with a `templates/` folder in the IDE → Flask threw `jinja2.exceptions.TemplateNotFound: index.html`
- **Root Cause**: Stale/zombie processes (15+) were found on port 5000. These processes were started from old "Run" button executions before the `killProcessTree` fix. When the Run button timed out (30s), it deleted the temporary directory but the Flask subprocess survived (due to `child.kill()` limitation on Windows). Visiting port 5000 hit the **old** process whose files were already deleted → TemplateNotFound.
- **Fix**: Killed all zombie python processes and confirmed `killProcessTree` (using `taskkill /F /T /PID`) prevents future occurrences. Verified with a reproduction Flask app serving `templates/index.html`.
- **Files**: `backend/index.js`

---

## Unresolved Issues 🔴

None currently identified. Previous fixes are working as expected.

| File | Changes |
|------|---------|
| `backend/index.js` | `killProcessTree()`, `terminal_run`/`terminal_kill` socket events, `executeCode` multi-file support, debug logging |
| `frontend/src/contexts/session-context.tsx` | Socket-based terminal, `killTerminal`, `isTerminalRunning`, `getFilePath()` for folder paths, `files` in `executeCode` deps |
| `frontend/src/components/ide/header.tsx` | Custom portal modal for Export, `getFilePath()` for folder paths |
| `frontend/src/components/ide/bottom-panel.tsx` | Stop button, trash kills process, running indicator |
