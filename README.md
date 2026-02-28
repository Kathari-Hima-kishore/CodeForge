# CodeForge - Collaborative Browser IDE

Real-time collaborative code editor with multi-language support and session management.

## Features

- 🔐 **Firebase Authentication** - Secure email/password login
- 👥 **Real-time Collaboration** - Multiple users can code together
- 🎭 **Role-based Access** - Host, Co-Host, Editor, Viewer roles
- 💬 **Live Chat** - Built-in messaging for session participants
- ▶️ **Multi-language Execution** - Python, JavaScript, TypeScript, Java, C++, C, C#
- 🌐 **ngrok Tunneling** - Share sessions with remote users

## Quick Start

### Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend && npm install && cd ..
```

### Run Development Server

```bash
# Runs both frontend and backend together
npm run dev
```

The frontend will be available at http://localhost:9002
The backend API will be at http://localhost:5000

Press Ctrl+C to stop both services.

## Project Structure

```
IDE/
├── backend/           # Python Flask + Socket.IO server
│   └── server.py
├── frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/           # Pages
│   │   ├── components/    # UI components
│   │   ├── contexts/      # State management
│   │   └── hooks/         # Custom hooks
│   └── package.json
├── requirements.txt
└── start.py
```

## Tech Stack

**Frontend:** Next.js 15, TypeScript, Tailwind CSS, Radix UI, Socket.IO, Firebase Auth
**Backend:** Python Flask, python-socketio, eventlet, pyngrok

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/execute` | POST | Execute code |
| `/api/terminal` | POST | Run terminal command |
| `/api/languages` | GET | List supported languages |

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
| `ban_user` | Ban user (host) |
| `change_role` | Change user role (host) |
| `lock_session` | Lock/unlock session (host) |
| `chat_message` | Send chat message |
| `run_code` | Execute code |
| `cursor_update` | Broadcast cursor position |
| `file_update` | Sync file changes |

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

## Firebase Setup (Optional)

1. Create a Firebase project at https://console.firebase.google.com
2. Go to Project Settings → Service Accounts
3. Click "Generate new private key"
4. Save as `firebase-service-account.json` in project root

## ngrok Setup (Optional)

1. Sign up at https://ngrok.com
2. Install: `pip install pyngrok`
3. Authenticate: `ngrok config add-authtoken YOUR_TOKEN`

Server will automatically create a tunnel and display the public URL.

## Configuration

Edit `backend/server.py` CONFIG dict:

```python
CONFIG = {
    'host': '0.0.0.0',
    'port': 5000,
    'max_execution_time': 30,
    'max_output_size': 50000,
    'enable_ngrok': True,
    'firebase_credentials_path': 'firebase-service-account.json',
    'cors_origins': '*',
}
```
