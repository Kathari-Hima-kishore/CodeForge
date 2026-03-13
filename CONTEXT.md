# CodeForge - Current Context & Status

## Recent Changes (2026-03-12)

### 1. Monaco Editor Integration ✅
- **Feature**: Full Monaco Editor integration replacing the textarea-based editor
- **Changes**:
  - File Explorer with expand/collapse and resize (fixed collapse button visibility)
  - Chat Panel with expand/collapse and resize (fixed drag direction)
  - Monaco Editor with syntax highlighting and auto-completion
  - Output/Terminal panel only under code editor (fixed overflow issue)
  - Drag handles fixed (direction now correct)
- **Files**:
  - `frontend/src/app/ide/page.tsx` — Main IDE page now uses Monaco Editor
  - `frontend/package.json` — Added `@monaco-editor/react` dependency
  - `frontend/src/app/ide/monaco-test/` — Removed (no longer needed)

### 2. File Locking System ✅
- **Feature**: When User A opens a file, it's locked for others
- **Files**:
  - `backend/index.js` — File lock manager, socket events
  - `frontend/src/contexts/session-context.tsx` — File lock state
  - `frontend/src/components/ide/file-explorer.tsx` — Lock indicator
  - `frontend/src/components/ide/code-editor-panel.tsx` — Read-only mode when locked

### 3. Docker Hub Integration ✅
- **Feature**: Users can build container images and push to Docker Hub
- **Files**:
  - `backend/index.js` — Docker Hub API endpoints
  - `frontend/src/components/ide/header.tsx` — Docker Hub UI

---

## Known Issues & Errors (Unfixed)

### 🔴 Critical: Session Persistence to Firestore
**Status**: `UNFIXED` | **Impact**: High | **Priority**: Critical

**Problem**: 
- Sessions are NOT persisting to Firestore
- User reported: "on firebase, the firestore was empty"
- Frontend writes to Firestore but backend manages sessions in memory
- Backend only reads from Firestore when "resurrecting" sessions

**Root Cause**:
- Backend `SessionData` class stores sessions in memory only
- Backend's `saveSessionToFirestore()` function exists but not integrated properly
- No mechanism to sync backend memory to Firestore

**Affected Files**:
- `backend/index.js` — SessionData class, saveSessionToFirestore() function
- `frontend/src/contexts/session-context.tsx` — Session creation and queries

**Solution Needed**:
1. Backend must write sessions to Firestore on create/update
2. Backend should read from Firestore on startup
3. Ensure `saveSessionToFirestore()` is called in all session mutations

---

### 🔴 Critical: Port Conflicts & Server Instability
**Status**: `UNFIXED` | **Impact**: High | **Priority**: Critical

**Problem**:
- Backend port keeps changing: 5001 → 5002 → 5003 → 5004 → 5005
- Frontend port 9002 occupied by orphaned process (PID 17508)
- Old Node processes not killed properly

**Current State**:
- Backend: Port 5005 (as of last log)
- Frontend: Port 9003 (PID 16644)
- Old processes: Ports 5001, 5002, 5003, 5004, 9002, 9003, 9004, 9005

**Solution Needed**:
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Restart with consistent ports
cd backend && npm run dev  # Should use port 5001
cd frontend && npm run dev:no-open  # Should use port 9002
```

---

### 🟡 Medium: Firestore Security Rules
**Status**: `UNFIXED` | **Impact**: Medium | **Priority**: Medium

**Problem**:
- Security rules may not be deployed to Firebase
- Rules look correct but user reports empty Firestore
- Need to verify rules are active

**Solution Needed**:
```bash
firebase deploy --only firestore:rules
```

---

### 🟡 Medium: Dual Session System Architecture
**Status**: `UNFIXED` | **Impact**: Medium | **Priority**: Medium

**Problem**:
- Frontend creates sessions in Firestore via `setDoc`
- Backend creates sessions in memory via `SessionData` class
- Backend reads from Firestore but doesn't write back
- Inconsistent session state between frontend and backend

**Solution Needed**:
- Decide: Keep dual system or consolidate to single source of truth
- If keeping dual: Add bidirectional sync
- If consolidating: Move all session logic to Firestore or all to backend memory

---

## File Changes Summary

| File | Changes |
|------|---------|
| `frontend/src/app/ide/page.tsx` | New Monaco Editor page with all UI components |
| `frontend/package.json` | Added `@monaco-editor/react` dependency |
| `frontend/src/contexts/session-context.tsx` | File locks, Socket terminal, killTerminal |
| `backend/index.js` | File lock manager, Docker Hub API, killProcessTree |

---

## Visual Layout

```
Header (session info, share, leave, account)
├── File Explorer (left, collapsible, resizable)
├── Chat/Participants (middle, collapsible, resizable)
└── Editor Column (center, contains Monaco + Output)
    ├── Toolbar (file info, run button)
    ├── Monaco Editor (flex-1)
    ├── Resize Handle (vertical)
    └── Output/Terminal (bottom panel)
```
