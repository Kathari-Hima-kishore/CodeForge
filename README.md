# CodeForge - Collaborative Browser IDE

Real-time collaborative code editor with multi-language support and session management.

## Features

- 🔐 **Firebase Authentication** - Secure email/password login
- 👥 **Real-time Collaboration** - Multiple users can code together
- 🎭 **Role-based Access** - Host, Co-Host, Editor, Viewer roles
- 💬 **Live Chat** - Built-in messaging for session participants
- 🔒 **File Locking** - Prevents edit conflicts with lock indicators
- ▶️ **Multi-language Execution** - Python, JavaScript, TypeScript, Java, C++, C, C#
- 🖥️ **Terminal** - Full terminal with real-time streaming (no timeout)
- 🐳 **Docker Export** - Build and push container images to Docker Hub
- 🌐 **ngrok Tunneling** - Share sessions with remote users

## Quick Start

### Install Dependencies

```bash
# Install Node.js dependencies
cd frontend && npm install
cd ../backend && npm install
```

### Run Development Server

```bash
# From root directory - runs both frontend and backend together
npm run dev
```

The frontend will be available at http://localhost:9002
The backend runs on port 5001 (dynamically allocated if in use)

Press Ctrl+C to stop both services.

## Project Structure

```
CodeForge/
├── backend/           # Node.js Express + Socket.IO server
│   ├── index.js       # Main server entry
│   ├── package.json
│   └── firebase-service-account.json
├── frontend/          # Next.js 15 React application
│   ├── src/
│   │   ├── app/           # Pages
│   │   ├── components/   # UI components
│   │   │   ├── ide/      # IDE components (editor, terminal, file explorer)
│   │   │   ├── ui/       # Reusable UI components
│   │   │   └── session/  # Session management components
│   │   ├── contexts/     # React contexts (auth, session)
│   │   └── lib/          # Utilities
│   └── package.json
├── AGENTS.md          # Developer guidelines
├── CONTEXT.md         # Current development context
└── package.json
```

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, Radix UI, Socket.IO, Firebase Auth
**Backend:** Node.js, Express, Socket.IO, Firebase Admin, Dockerode

## Socket.IO Events

### Client → Server

| Event | Description |
|-------|-------------|
| `create_session` | Create a new session |
| `join_session` | Join existing session |
| `leave_session` | Leave current session |
| `approve_user` | Approve join request (host) |
| `deny_user` | Deny join request (host) |
| `kick_user` | Kick user (host) |
| `change_role` | Change user role (host) |
| `lock_session` | Lock/unlock session (host) |
| `chat_message` | Send chat message |
| `run_code` | Execute code |
| `cursor_update` | Broadcast cursor position |
| `file_update` | Sync file changes |
| `file_open` | Open a file (acquires lock) |
| `file_close` | Close a file (releases lock) |
| `file_write_activity` | Update write activity timestamp |
| `terminal_run` | Run terminal command |
| `terminal_kill` | Kill terminal process |

### Server → Client

| Event | Description |
|-------|-------------|
| `join_request` | New join request (to host) |
| `join_approved` | Join approved |
| `join_denied` | Join denied |
| `user_joined` | User joined session |
| `user_left` | User left session |
| `user_kicked` | You were kicked |
| `role_changed` | Role was changed |
| `session_locked` | Session lock state changed |
| `session_ended` | Session ended |
| `chat_message` | New chat message |
| `execution_result` | Code execution result |
| `cursor_update` | Remote cursor update |
| `file_update` | Remote file change |
| `file_lock_update` | File lock status changed |
| `file_lock_released` | File lock was released |
| `terminal_output` | Terminal output streaming |
| `terminal_exit` | Terminal process exited |

## Firebase Setup (Required)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password)
3. Enable **Firestore Database**
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key"
6. Save as `firebase-service-account.json` in `backend/` directory
7. Create `frontend/.env.local` with your Firebase config:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Docker Hub Setup (Optional)

1. Create a Docker Hub account at https://hub.docker.com
2. Generate a Personal Access Token (PAT) at https://hub.docker.com/settings/security
3. Use your username/email + PAT in the Export dialog

## Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Frontend port | `package.json` | 9002 |
| Backend port | `backend/index.js` | 5001 |
| Firebase config | `frontend/.env.local` | - |
| Service account | `backend/firebase-service-account.json` | - |

## Key Features Details

### Terminal
- Real-time streaming via Socket.IO (no timeout)
- Full folder structure preserved
- Files written to temp directory before execution

### File Locking
- Auto-expire after 5 minutes of no write activity
- Instant release on file close or user disconnect
- Read-only mode for locked files

### Docker Export
- Auto-detects framework (Flask, FastAPI, Express, Django)
- Builds and pushes to Docker Hub
- Creates repo if it doesn't exist
