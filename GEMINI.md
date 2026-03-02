# CodeForge - Collaborative Browser IDE

CodeForge is a real-time collaborative browser-based IDE that enables multiple users to code together in real-time. It features a robust multi-language execution engine, an integrated terminal, and session-based collaboration.

## Project Overview

- **Purpose**: Provide a seamless, cloud-like IDE experience locally or over a tunnel, with real-time sync for code, cursors, and terminal output.
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Radix UI.
- **Backend**: Node.js, Express, Socket.IO for real-time events.
- **Authentication**: Firebase Authentication.
- **Collaboration**: Socket.IO handles real-time cursor tracking, file updates, and chat messages.
- **Execution Engine**: Supports Python, JavaScript, TypeScript, Java, C++, C, and C# via local compilers/interpreters.

## Project Structure

- `backend/`: Node.js server handling Socket.IO connections, code execution, and terminal processes.
- `frontend/`: Next.js application containing the IDE user interface and collaboration logic.
- `frontend/src/contexts/`: Global state management for authentication and real-time sessions.
- `frontend/src/components/ide/`: Core IDE panels (Editor, Chat, Terminal, File Explorer).

## Building and Running

### Prerequisites

- Node.js (v18+)
- Compilers/Interpreters for supported languages (e.g., Python, GCC for C++, Node.js)
- Docker Desktop (Optional, for "Build Container" features)

### Setup

1.  **Install Root Dependencies**:
    ```bash
    npm install
    ```
2.  **Initialize Environments**:
    - Create a `.env` in `frontend/` based on `env.example`.
    - (Optional) Place `firebase-service-account.json` in the root for backend Firebase Admin features.

### Development

Start both frontend and backend concurrently from the root:
```bash
npm run dev
```
- **Frontend**: http://localhost:9002
- **Backend**: http://localhost:5001 (or the next available port)

### Production Build

```bash
npm run build
npm start
```

## Development Conventions

### Styling & UI
- **Tailwind CSS**: Use utility classes for styling.
- **Theme**: Dark Slate Gray (`#303A46`) background, Cobalt Blue (`#3B79C9`) primary accents, Teal (`#34A7A7`) for active states.
- **Icons**: Use `lucide-react`.

### Real-time Logic
- **Socket.IO**: All collaborative events (typing, scrolling, selection) are emitted via the `SessionContext`.
- **Process Management**: On Windows, always use `killProcessTree` (via `taskkill /F /T`) in the backend to ensure child processes (like Flask apps or infinite loops) are fully terminated.

### Architecture Notes
- **Terminal System**: Powered by Socket.IO streaming for low-latency output.
- **Code Execution**: Files are written to unique temporary directories in `os.tmpdir()` before execution to isolate sessions.
- **Multi-file Support**: The "Run" button sends the entire project file state to the backend to preserve folder structures (e.g., Flask templates).
