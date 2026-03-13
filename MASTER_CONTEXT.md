# CodeForge - Master Context & Project Status

**Last Updated**: 2026-03-12
**Project**: Real-time Collaborative Browser IDE
**Status**: Development in Progress

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Status](#current-status)
3. [Critical Issues](#critical-issues)
4. [Medium Priority Issues](#medium-priority-issues)
5. [Completed Work](#completed-work)
6. [Files & Architecture](#files--architecture)
7. [Technical Stack](#technical-stack)
8. [Configuration](#configuration)
9. [Server Status](#server-status)
10. [Work Needed](#work-needed)
11. [Testing Checklist](#testing-checklist)
12. [Deployment Notes](#deployment-notes)

---

## Project Overview

CodeForge is a real-time collaborative code editor with multi-language support and session management. Users can:
- Create/join coding sessions
- Edit files collaboratively with live cursors
- Execute code in multiple languages (Python, JavaScript, TypeScript, Java, C++, C, C#)
- Chat with session participants
- Lock files to prevent edit conflicts
- Export to Docker containers

### Key Features
- 🔐 **Firebase Authentication** - Secure email/password login
- 👥 **Real-time Collaboration** - Multiple users can code together
- 🎭 **Role-based Access** - Host, Co-Host, Editor, Viewer roles
- 💬 **Live Chat** - Built-in messaging for session participants
- 🔒 **File Locking** - Prevents edit conflicts with lock indicators
- ▶️ **Multi-language Execution** - Python, JavaScript, TypeScript, Java, C++, C, C#
- 🖥️ **Terminal** - Full terminal with real-time streaming (no timeout)
- 🐳 **Docker Export** - Build and push container images to Docker Hub
- 🌐 **ngrok Tunneling** - Share sessions with remote users

---

## Current Status

### Overall Status: ⚠️ DEGRADED
- **Sessions**: Not persisting to Firestore
- **Ports**: Multiple conflicts, unstable
- **Backend**: Running but not syncing with Firestore
- **Frontend**: Running but sessions not appearing after logout/login

### Component Status

| Component | Status | Port | Notes |
|-----------|--------|------|-------|
| Backend | ⚠️ Running | 5005 | Keeps changing ports, not persisting sessions |
| Frontend | ⚠️ Running | 9003 | Should be 9002, sessions not showing |
| Firebase | ⚠️ Partial | - | Auth works, Firestore empty |
| Monaco Editor | ✅ Working | - | Syntax highlighting functional |
| File Locking | ✅ Working | - | Lock/unlock functional |
| Terminal | ✅ Working | - | Streaming output working |
| Docker Export | ✅ Working | - | Build/push to Docker Hub working |

---

## Critical Issues

### 1. Session Persistence to Firestore
**Status**: `UNFIXED` | **Impact**: HIGH | **Priority**: CRITICAL

**Problem Description**:
- Sessions are NOT persisting to Firestore
- User reported: "on firebase, the firestore was empty"
- Frontend writes to Firestore via `setDoc()` but backend manages sessions in memory
- Backend only reads from Firestore when "resurrecting" sessions
- Sessions appear temporarily but disappear after logout/login

**Root Cause Analysis**:
1. Backend `SessionData` class stores sessions exclusively in memory
2. Backend's `saveSessionToFirestore()` function exists but isn't integrated properly
3. No mechanism to sync backend memory state to Firestore
4. Frontend creates sessions in Firestore but backend creates separate in-memory sessions

**Affected Files**:
- `backend/index.js` - SessionData class (lines 374-429), saveSessionToFirestore() function (lines 386-407)
- `frontend/src/contexts/session-context.tsx` - createSession(), joinSession() functions
- `firestore.rules` - Security rules may not be deployed

**Evidence**:
- Backend log: `🔄 Session YDCM4HVT resurrected from Firestore` (session exists in backend memory)
- User report: Firestore console shows empty
- Frontend console: Queries return 0 results

**Solution Needed**:
```javascript
// 1. Backend must write sessions to Firestore on create/update
await saveSessionToFirestore(session);

// 2. Backend should read from Firestore on startup
const sessionsSnapshot = await db.collection('sessions')
  .where('isActive', '==', true)
  .get();

// 3. Ensure saveSessionToFirestore() is called in all session mutations
//    - create_session
//    - join_session
//    - file_update
//    - participant joins/leaves
```

**Verification Steps**:
1. Check backend logs for "💾 Session saved to Firestore" messages
2. Verify Firebase Admin SDK initialization: `✅ Firebase Admin SDK initialized`
3. Check Firestore console after creating a session
4. Verify security rules are deployed

---

### 2. Port Conflicts & Server Instability
**Status**: `UNFIXED` | **Impact**: HIGH | **Priority**: CRITICAL

**Problem Description**:
- Backend port keeps changing: 5001 → 5002 → 5003 → 5004 → 5005
- Frontend port 9002 occupied by orphaned process (PID 17508)
- Old Node processes not killed properly
- Inconsistent port configuration between files

**Current State**:
```
Backend: Port 5005 (as of last log)
Frontend: Port 9003 (PID 16644)
Old processes occupying:
  - Port 5001 (PID 23708)
  - Port 5002 (PID 4404)
  - Port 5003 (PID 9160)
  - Port 5004 (PID 24280)
  - Port 9002 (PID 17508)
  - Port 9003 (PID 1360)
  - Port 9004 (PID 1312)
  - Port 9005 (PID 21624)
```

**Affected Files**:
- `backend/index.js` - Line 54: `port: parseInt(process.env.PORT || "5001")`
- `frontend/.env` - Line 10: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5005`
- `frontend/.env.local` - Line 10: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5005`
- `package.json` - Line 21: `dev:no-open": "next dev --turbopack -p 9002"`

**Solution Needed**:
```bash
# 1. Kill all Node processes completely
taskkill /F /IM node.exe

# 2. Verify ports are free
netstat -ano | findstr ":500|:900"

# 3. Restart backend on consistent port (5001)
cd backend && npm run dev

# 4. Restart frontend on consistent port (9002)
cd frontend && npm run dev:no-open

# 5. Update environment files to use consistent ports
#    - frontend/.env: NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
#    - frontend/.env.local: NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
#    - backend/index.js: CONFIG.port = 5001 (or use env var)
```

**Verification Steps**:
1. Check `netstat -ano | findstr ":5001"` shows backend
2. Check `netstat -ano | findstr ":9002"` shows frontend
3. Verify backend responds: `curl http://localhost:5001`
4. Verify frontend responds: `curl http://localhost:9002`

---

### 3. Dual Session System Architecture
**Status**: `UNFIXED` | **Impact**: MEDIUM | **Priority**: HIGH

**Problem Description**:
- Frontend creates sessions in Firestore via `setDoc()`
- Backend creates sessions in memory via `SessionData` class
- Backend reads from Firestore but doesn't write back
- Inconsistent session state between frontend and backend

**Architecture Flow**:
```
Frontend: createSession() → Firestore (sessions collection)
         ↓
Backend: join_session → Checks memory → Not found → Resurrects from Firestore
         ↓
Backend: Creates SessionData in memory (NOT synced back to Firestore)
```

**Affected Files**:
- `frontend/src/contexts/session-context.tsx` - createSession(), joinSession()
- `backend/index.js` - SessionData class, create_session, join_session handlers

**Solution Options**:
1. **Option A**: Consolidate to Firestore only
   - Move all session logic to Firestore
   - Backend reads/writes directly to Firestore
   - Remove SessionData class

2. **Option B**: Consolidate to backend memory only
   - Remove Firestore session writes from frontend
   - Backend manages all sessions in memory
   - Add persistence layer for session recovery

3. **Option C**: Bidirectional sync (Current attempt)
   - Backend writes to Firestore via saveSessionToFirestore()
   - Frontend reads from Firestore
   - Both sync on mutations

---

## Medium Priority Issues

### 4. Firestore Security Rules
**Status**: `UNFIXED` | **Impact**: MEDIUM | **Priority**: MEDIUM

**Problem**:
- Security rules may not be deployed to Firebase
- Rules look correct but user reports empty Firestore
- Need to verify rules are active

**Solution**:
```bash
firebase deploy --only firestore:rules
```

**Security Rules** (`firestore.rules`):
```javascript
allow create: if request.auth != null && request.resource.data.hostId == request.auth.uid;
allow read: if request.auth != null;
allow update: if request.auth != null && (
  resource.data.hostId == request.auth.uid || 
  resource.data.participants[request.auth.uid] != null ||
  request.resource.data.participants[request.auth.uid] != null
);
allow delete: if request.auth != null && resource.data.hostId == request.auth.uid;
```

---

## Completed Work

### ✅ Monaco Editor Integration
**Status**: COMPLETE
- **Feature**: Full Monaco Editor integration replacing textarea-based editor
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

### ✅ File Locking System
**Status**: COMPLETE
- **Feature**: When User A opens a file, it's locked for others
- **Files**:
  - `backend/index.js` — File lock manager, socket events
  - `frontend/src/contexts/session-context.tsx` — File lock state
  - `frontend/src/components/ide/file-explorer.tsx` — Lock indicator
  - `frontend/src/components/ide/code-editor-panel.tsx` — Read-only mode when locked

### ✅ Docker Hub Integration
**Status**: COMPLETE
- **Feature**: Users can build container images and push to Docker Hub
- **Files**:
  - `backend/index.js` — Docker Hub API endpoints
  - `frontend/src/components/ide/header.tsx` — Docker Hub UI

### ✅ Context Files Updated
**Status**: COMPLETE
- **Files Updated**:
  - `frontend/src/contexts/session-context.tsx` — Syntax fixes, query improvements
  - `frontend/src/contexts/auth-context.tsx` — Code cleanup

---

## Files & Architecture

### Project Structure
```
CodeForge/
├── backend/
│   ├── index.js                 # Main server entry (1800+ lines)
│   ├── package.json
│   └── firebase-service-account.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Root page (redirects to IDE)
│   │   │   └── ide/
│   │   │       ├── page.tsx     # Main IDE page with Monaco
│   │   │       └── layout.tsx
│   │   ├── components/
│   │   │   ├── ide/
│   │   │   │   ├── file-explorer.tsx
│   │   │   │   ├── chat-panel.tsx
│   │   │   │   ├── code-editor-panel.tsx
│   │   │   │   ├── bottom-panel.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   └── main-layout.tsx
│   │   │   ├── ui/              # Reusable UI components
│   │   │   └── session/         # Session management
│   │   ├── contexts/
│   │   │   ├── auth-context.tsx
│   │   │   └── session-context.tsx
│   │   └── lib/
│   │       └── firebase.ts
│   └── package.json
├── firestore.rules              # Firebase security rules
├── AGENTS.md                    # Agent guidelines
├── CONTEXT.md                   # Current development context
├── MASTER_CONTEXT.md            # This file - comprehensive status
├── MONACO_INTEGRATION_SUMMARY.md
├── README.md
└── package.json
```

### Key Files Summary

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `backend/index.js` | Server logic, Socket.IO, session management | 1800+ | ⚠️ Needs fixes |
| `frontend/src/contexts/session-context.tsx` | Session state & Firestore sync | 1128 | ✅ Updated |
| `frontend/src/contexts/auth-context.tsx` | Authentication state | 215 | ✅ Updated |
| `frontend/src/app/ide/page.tsx` | Main IDE page with Monaco | ~300 | ✅ Working |
| `frontend/src/components/ide/code-editor-panel.tsx` | Monaco Editor component | ~150 | ✅ Working |
| `firestore.rules` | Firebase security rules | 32 | ⚠️ Needs deploy |

---

## Technical Stack

### Frontend
- **Framework**: Next.js 15 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Real-time**: Socket.IO Client
- **Auth/DB**: Firebase (Auth + Firestore)

### Backend
- **Runtime**: Node.js
- **Framework**: Express + Socket.IO
- **Auth/DB**: Firebase Admin SDK
- **Code Execution**: Child processes (spawn/exec)
- **Docker**: Dockerode
- **Compression**: Archiver

### Firebase Configuration
```
Project ID: codeforge-khk
Auth Domain: codeforge-khk.firebaseapp.com
Storage: codeforge-khk.firebasestorage.app
```

---

## Configuration

### Environment Variables

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCacO3xAjNCWdy774jKjCcP4rrwcUoSzmo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=codeforge-khk.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=codeforge-khk
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=codeforge-khk.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=661234466057
NEXT_PUBLIC_FIREBASE_APP_ID=1:661234466057:web:fc0af044739b9c5e9da7d8
NEXT_PUBLIC_BACKEND_URL=http://localhost:5005  # ⚠️ Should be 5001
```

**Backend** (`backend/index.js`):
```javascript
CONFIG = {
  host: "0.0.0.0",
  port: parseInt(process.env.PORT || "5001"),  // ⚠️ Keeps changing
  max_execution_time: 30,
  max_output_size: 50000,
  firebase_credentials_path: "firebase-service-account.json",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:9002"
}
```

### Port Configuration

| Service | Expected Port | Current Port | Status |
|---------|---------------|--------------|--------|
| Backend | 5001 | 5005 | ⚠️ Changed |
| Frontend | 9002 | 9003 | ⚠️ Changed |

---

## Server Status

### Current Running Processes
```
Backend:  Port 5005 (PID unknown)
Frontend: Port 9003 (PID 16644)

Old orphaned processes:
  Port 5001 (PID 23708) - Backend attempt
  Port 5002 (PID 4404)  - Backend attempt
  Port 5003 (PID 9160)  - Backend attempt
  Port 5004 (PID 24280) - Backend attempt
  Port 9002 (PID 17508) - Frontend attempt
  Port 9003 (PID 1360)  - Frontend attempt
  Port 9004 (PID 1312)  - Frontend attempt
  Port 9005 (PID 21624) - Frontend attempt
```

### Access URLs
- **Frontend**: http://localhost:9003 (currently) → Should be http://localhost:9002
- **Backend**: http://localhost:5005 (currently) → Should be http://localhost:5001
- **Firebase Console**: https://console.firebase.google.com/project/codeforge-khk

---

## Work Needed

### Immediate Actions (Priority 1)
1. **Kill all Node processes**
   ```bash
   taskkill /F /IM node.exe
   ```

2. **Verify ports are free**
   ```bash
   netstat -ano | findstr ":500|:900"
   ```

3. **Fix environment configuration**
   - Update `frontend/.env`: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5001`
   - Update `frontend/.env.local`: `NEXT_PUBLIC_BACKEND_URL=http://localhost:5001`
   - Ensure backend uses port 5001 consistently

4. **Restart servers on consistent ports**
   ```bash
   cd backend && npm run dev  # Should use port 5001
   cd frontend && npm run dev:no-open  # Should use port 9002
   ```

### Session Persistence Fixes (Priority 2)
1. **Verify saveSessionToFirestore() is called**
   - In `create_session` handler
   - In `join_session` handler
   - In `file_update` handler

2. **Test session creation flow**
   - Create session in frontend
   - Check backend logs for "💾 Session saved to Firestore"
   - Check Firestore console for session document

3. **Deploy security rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### Code Quality (Priority 3)
1. **Run linting and type checking**
   ```bash
   cd frontend && npm run lint && npm run typecheck
   ```

2. **Remove console.log statements** (except for debugging)
3. **Add error boundaries** for better error handling

---

## Testing Checklist

### Session Creation & Persistence
- [ ] User can create a session
- [ ] Session appears in Firestore console
- [ ] Session appears in "My Sessions" list
- [ ] Session persists after logout/login
- [ ] Other users can join the session

### File Operations
- [ ] Can create new files
- [ ] Can edit file content
- [ ] Changes sync to Firestore
- [ ] File locking works
- [ ] Multiple users see same file state

### Code Execution
- [ ] Can execute Python code
- [ ] Can execute JavaScript code
- [ ] Can execute TypeScript code
- [ ] Output appears correctly
- [ ] Errors are displayed

### Collaboration Features
- [ ] Chat messages sync between users
- [ ] Cursor positions sync
- [ ] File locks prevent concurrent edits
- [ ] User roles work correctly

---

## Deployment Notes

### Firebase Deployment
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy all Firebase resources
firebase deploy
```

### Production Deployment
1. Build frontend: `cd frontend && npm run build`
2. Start backend: `cd backend && npm start`
3. Configure environment variables for production
4. Set up SSL/TLS certificates
5. Configure domain and DNS

---

## Appendix

### Socket.IO Events

**Client → Server**:
- `create_session`, `join_session`, `leave_session`
- `run_code`, `terminal_run`, `terminal_kill`
- `file_update`, `cursor_update`
- `chat_message`, `approve_user`, `deny_user`, `kick_user`

**Server → Client**:
- `user_joined`, `user_left`, `user_kicked`
- `execution_result`, `terminal_output`, `terminal_exit`
- `file_update`, `cursor_update`, `chat_message`

### Supported Languages
- Python (.py)
- JavaScript (.js)
- TypeScript (.ts)
- Java (.java)
- C++ (.cpp)
- C (.c)
- C# (.cs)
- HTML (.html)
- CSS (.css)

### File Locking Rules
- Auto-expire after 5 minutes of no write activity
- Instant release on file close or user disconnect
- Read-only mode for locked files
- Lock indicator shows who has the file locked

---

**Document Version**: 1.0
**Last Modified**: 2026-03-12
**Maintainer**: CodeForge Development Team
