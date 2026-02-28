const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const admin = require('firebase-admin');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const archiver = require('archiver');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  host: "0.0.0.0",
  port: parseInt(process.env.PORT || "5001"),
  max_execution_time: 30, // seconds
  max_output_size: 50000,
  firebase_credentials_path: "firebase-service-account.json",
  frontend_url: process.env.FRONTEND_URL || "http://localhost:9002"
};

// =============================================================================
// Firebase Initialization
// =============================================================================

let FIREBASE_INITIALIZED = false;
let db = null;

function initFirebase() {
  const rootDir = path.resolve(__dirname, '..');
  let creds_path = path.join(__dirname, CONFIG.firebase_credentials_path);

  if (!fs.existsSync(creds_path)) {
    creds_path = path.join(rootDir, CONFIG.firebase_credentials_path);
  }

  if (fs.existsSync(creds_path)) {
    try {
      const serviceAccount = require(creds_path);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      FIREBASE_INITIALIZED = true;
      db = admin.firestore();
      console.log("✅ Firebase Admin SDK initialized");
    } catch (e) {
      console.warn(`⚠️  Firebase initialization failed: ${e.message}`);
    }
  } else {
    console.warn(`⚠️  Firebase credentials not found at ${creds_path}. Auth disabled.`);
  }
}

initFirebase();

// =============================================================================
// Authentication Middleware
// =============================================================================

async function verifyFirebaseToken(req, res, next) {
  if (!FIREBASE_INITIALIZED) return next();

  let idToken = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    idToken = req.headers.authorization.split(' ')[1];
  }

  if (!idToken) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: `Invalid token: ${error.message}` });
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function generateSessionId(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(chars.length));
  }
  return result;
}

function generateColor() {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308",
    "#84cc16", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"
  ];
  return colors[crypto.randomInt(colors.length)];
}

async function findFreePort(startPort = 5001, maxTries = 5) {
  // Try a few ports near the default to maintain predictability
  const net = require('net');
  const isPortAvailable = (port) => {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, '0.0.0.0', () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
  };

  for (let port = startPort; port < startPort + maxTries; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} in use, trying next...`);
  }
  
  throw new Error(`Could not find a free port between ${startPort} and ${startPort + maxTries - 1}`);
}

// =============================================================================
// Code Execution Logic
// =============================================================================

const langConfig = {
  "python": { ext: ".py", cmd: "python" },
  "javascript": { ext: ".js", cmd: "node" },
  "typescript": { ext: ".ts", cmd: "npx", args: ["ts-node"] },
  "java": { ext: ".java", cmd: "java" },
  "cpp": { ext: ".cpp", compiler: "g++", out: "out" },
  "c": { ext: ".c", compiler: "gcc", out: "out" },
  "html": { ext: ".html", type: "browser" },
  "css": { ext: ".css", type: "browser" },
};

async function executeCode(language, code, stdin = "") {
  if (!code || !code.trim()) {
    return { error: "Empty code" };
  }

  const lang = language.toLowerCase();
  const config = langConfig[lang];
  if (!config) {
    return { error: `Language ${language} not supported` };
  }

  // HTML/CSS are browser-based, not executable via CLI
  if (config.type === "browser") {
    return { 
      stdout: `📄 ${language.toUpperCase()} files cannot be executed directly.\n\n💡 To view your ${language.toUpperCase()} code:\n   • Open the file in a web browser\n   • Or save it locally and open in your browser\n\n📝 Tip: For HTML, create an index.html file and open it in any browser.`,
      info: "browser_only"
    };
  }

  // Create unique temp directory
  const tmpDir = path.join(os.tmpdir(), `codeforge-${uuidv4()}`);
  fs.mkdirSync(tmpDir, { recursive: true });
  
  const fileName = lang === "java" ? "Main.java" : `main${config.ext}`;
  const filePath = path.join(tmpDir, fileName);

  try {
    fs.writeFileSync(filePath, code);
    const startTime = Date.now();

    // Handle compilation for C/C++
    if (config.compiler) {
      const compileArgs = ["-o", config.out, filePath];
      await new Promise((resolve, reject) => {
        const compilerProcess = spawn(config.compiler, compileArgs, { cwd: tmpDir });
        let errOut = "";
        compilerProcess.stderr.on('data', data => errOut += data);
        compilerProcess.on('close', code => {
          if (code !== 0) reject({ stdout: "", stderr: errOut, exit_code: code });
          else resolve();
        });
      });
    }

    // Prepare execution command
    let cmd, args;
    if (config.compiler) {
      cmd = process.platform === 'win32' ? path.join(tmpDir, `${config.out}.exe`) : path.join(tmpDir, `./${config.out}`);
      args = [];
    } else if (config.args) {
      cmd = config.cmd;
      args = [...config.args, filePath];
    } else {
      cmd = config.cmd;
      // Allow overriding python alias on windows
      if (cmd === 'python' && process.platform !== 'win32') {
         cmd = 'python3';
      }
      args = [filePath];
    }

    return await new Promise((resolve) => {
      const child = spawn(cmd, args, { cwd: tmpDir });

      let stdoutData = "";
      let stderrData = "";
      const max_size = CONFIG.max_output_size;

      let isDone = false;

      // Timeout control
      const timer = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          child.kill('SIGKILL');
          resolve({
            error: "Execution timed out",
            stdout: stdoutData,
            stderr: stderrData,
            execution_time: CONFIG.max_execution_time
          });
        }
      }, CONFIG.max_execution_time * 1000);

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
        if (stdoutData.length > max_size) {
          stdoutData = stdoutData.slice(0, max_size) + "\n... [Output Truncated]";
          child.kill('SIGKILL');
        }
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
        if (stderrData.length > max_size) {
          stderrData = stderrData.slice(0, max_size) + "\n... [Output Truncated]";
          child.kill('SIGKILL');
        }
      });

      if (stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      child.on('close', (code, signal) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timer);
        
        const executionTime = (Date.now() - startTime) / 1000;
        resolve({
          stdout: stdoutData,
          stderr: stderrData,
          exit_code: signal ? 1 : (code || 0),
          execution_time: executionTime
        });
      });
      
      child.on('error', (err) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timer);
        resolve({
          error: `Failed to start process: ${err.message}`,
          stdout: stdoutData,
          stderr: stderrData,
        });
      });
    });

  } catch (e) {
    if (e.exit_code !== undefined) {
       // Compilation error case
       return { stdout: e.stdout, stderr: e.stderr, exit_code: e.exit_code, execution_time: 0 };
    }
    return { error: e.message || "Execution failed" };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Failed to remove temp dir ${tmpDir}:`, err);
    }
  }
}

async function notifyFrontend(event, data) {
  try {
    await fetch(`${CONFIG.frontend_url}/api/backend-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    });
  } catch (e) {
    // Silently fail if frontend is not yet ready
  }
}

// =============================================================================
// Session Storage
// =============================================================================

const sessions = {};
const connectedUsers = {};

class SessionData {
  constructor(sessionId, hostUid, hostName, settings) {
    this.id = sessionId;
    this.name = settings.name || `${hostName}'s Session`;
    this.host_uid = hostUid;
    this.host_sid = null;
    this.created_at = new Date().toISOString();
    this.participants = {};
    this.files = {};
    this.messages = [];
    this.is_active = true;
  }

  addParticipant(userUid, name, sid, role = "editor") {
    const participant = {
      uid: userUid,
      name: name,
      role: role,
      sid: sid,
      color: generateColor(),
      joined_at: new Date().toISOString()
    };
    this.participants[userUid] = participant;
    return participant;
  }

  removeParticipant(userUid) {
    if (this.participants[userUid]) {
      const p = this.participants[userUid];
      delete this.participants[userUid];
      return p;
    }
    return null;
  }

  getParticipantBySid(sid) {
    for (const uid in this.participants) {
      if (this.participants[uid].sid === sid) {
        return [uid, this.participants[uid]];
      }
    }
    return [null, null];
  }

  toDict() {
    return {
      sessionId: this.id,
      name: this.name,
      hostId: this.host_uid,
      hostName: this.participants[this.host_uid]?.name || "Host",
      participants: this.participants,
      files: Object.values(this.files),
      isActive: this.is_active
    };
  }
}

// =============================================================================
// Socket.IO Events
// =============================================================================

io.on('connection', (socket) => {
  const sid = socket.id;
  const auth = socket.handshake.auth || {};
  console.log(`🔌 Client connected: ${sid}`);

  const user_id = auth.userId || `anon_${sid.slice(0, 8)}`;
  const user_name = auth.userName || "Anonymous";
  const user_email = auth.userEmail || "";

  connectedUsers[sid] = {
    uid: user_id,
    name: user_name,
    email: user_email,
    session_id: null
  };

  socket.on('disconnect', () => {
    const userData = connectedUsers[sid];
    if (!userData) return;

    const sessionId = userData.session_id;
    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];
      const [userUid, participant] = session.getParticipantBySid(sid);

      if (userUid) {
        session.removeParticipant(userUid);
        io.to(sessionId).emit("user_left", { user_uid: userUid, name: participant.name });

        if (userUid === session.host_uid) {
          io.to(sessionId).emit("session_ended", { reason: "Host disconnected" });
          delete sessions[sessionId];
        }
      }
    }
    delete connectedUsers[sid];
    console.log(`🔌 Client disconnected: ${sid}`);
  });

  socket.on('create_session', (data, callback) => {
    const userData = connectedUsers[sid];
    if (!userData) return callback({ error: "Not authenticated" });

    let sessionId = data.session_id || generateSessionId();
    while (sessions[sessionId]) {
      sessionId = generateSessionId();
    }

    const session = new SessionData(
      sessionId,
      userData.uid,
      userData.name,
      data.settings || {}
    );
    
    session.host_sid = sid;
    session.addParticipant(userData.uid, userData.name, sid, "host");

    sessions[sessionId] = session;
    userData.session_id = sessionId;
    socket.join(sessionId);

    // Bridge: Notify frontend of session creation
    notifyFrontend('session_created', { sessionId, hostId: userData.uid });

    if (callback) callback({ success: true, session: session.toDict() });
  });

  socket.on('join_session', async (data, callback) => {
    const userData = connectedUsers[sid];
    if (!userData) return callback ? callback({ error: "Not authenticated" }) : null;

    let sessionId = data.session_id || data.sessionId;
    if (!sessionId) return callback ? callback({ error: "Session ID required" }) : null;

    sessionId = sessionId.toUpperCase().trim();

    if (!sessions[sessionId]) {
      if (db) {
        try {
          const doc = await db.collection("sessions").doc(sessionId).get();
          if (doc.exists) {
            const dataFs = doc.data();
            if (dataFs.isActive) {
              const session = new SessionData(
                sessionId,
                dataFs.hostId,
                dataFs.hostName,
                { name: dataFs.name }
              );

              if (dataFs.files) {
                dataFs.files.forEach(f => {
                  const fId = f.id || generateSessionId(12);
                  session.files[fId] = f;
                });
              }

              if (dataFs.participants) {
                for (const uid in dataFs.participants) {
                  const p = dataFs.participants[uid];
                  session.participants[uid] = {
                    uid: p.uid,
                    name: p.name,
                    role: p.role,
                    sid: null,
                    color: p.color || generateColor(),
                    joined_at: p.joinedAt || new Date().toISOString()
                  };
                }
              }

              sessions[sessionId] = session;
              console.log(`🔄 Session ${sessionId} resurrected from Firestore`);
            } else {
              return callback ? callback({ error: "Session is inactive" }) : null;
            }
          } else {
            return callback ? callback({ error: "Session not found" }) : null;
          }
        } catch (e) {
          console.error(`Error resurrecting session: ${e}`);
          return callback ? callback({ error: "Session not found" }) : null;
        }
      } else {
        return callback ? callback({ error: "Session not found" }) : null;
      }
    }

    const session = sessions[sessionId];
    const participant = session.addParticipant(userData.uid, userData.name, sid, "editor");

    userData.session_id = sessionId;
    socket.join(sessionId);

    socket.to(sessionId).emit("user_joined", {
      user_uid: userData.uid,
      name: userData.name,
      role: "editor",
      color: participant.color
    });

    if (callback) callback({ success: true, session: session.toDict() });
  });

  socket.on('leave_session', (data) => {
    const userData = connectedUsers[sid];
    if (!userData) return;

    const sessionId = userData.session_id;
    if (sessionId && sessions[sessionId]) {
      const session = sessions[sessionId];
      const [userUid, participant] = session.getParticipantBySid(sid);

      if (userUid) {
        session.removeParticipant(userUid);
        socket.leave(sessionId);
        userData.session_id = null;

        io.to(sessionId).emit("user_left", { user_uid: userUid, name: participant.name });

        if (userUid === session.host_uid) {
          io.to(sessionId).emit("session_ended", { reason: "Host left" });
          delete sessions[sessionId];
        }
      }
    }
  });

  socket.on('run_code', async (data, callback) => {
    const userData = connectedUsers[sid];
    const userName = userData ? userData.name : "Unknown";
    const sessionId = userData ? userData.session_id : data.sessionId;

    const language = (data.language || "").toLowerCase();
    const code = data.code || "";

    console.log(`▶️ run_code: ${language} for ${userName}`);

    try {
      const result = await executeCode(language, code);
      result.executed_by = userName;

      // Broadcast to room so others see the execution
      if (sessionId && sessionId !== "standalone") {
        socket.to(sessionId).emit("execution_result", result);
      }

      // Instead of emitting an event back, use the callback acknowledgement
      if (typeof callback === "function") {
        callback(result);
      } else {
        socket.emit("execution_result", result);
      }
    } catch (e) {
      const errorResult = { error: e.message || "Execution error", executed_by: userName };
      
      if (sessionId && sessionId !== "standalone") {
        socket.to(sessionId).emit("execution_result", errorResult);
      }

      if (typeof callback === "function") {
        callback(errorResult);
      } else {
        socket.emit("execution_result", errorResult);
      }
    }
  });

  socket.on('cursor_update', (data) => {
    const userData = connectedUsers[sid];
    if (!userData || !userData.session_id) return;

    const sessionId = userData.session_id;
    socket.to(sessionId).emit("cursor_update", {
      user_uid: userData.uid,
      name: userData.name,
      cursor: data.cursor,
      selection: data.selection
    });
  });

  socket.on('file_update', (data) => {
    const userData = connectedUsers[sid];
    if (!userData || !userData.session_id) return;

    const sessionId = userData.session_id;
    socket.to(sessionId).emit("file_update", data);
  });
});

// =============================================================================
// API Routes
// =============================================================================

app.get('/', (req, res) => {
  res.json({
    status: "online",
    service: "CodeForge Backend (Node.js)",
    timestamp: new Date().toISOString()
  });
});

app.post('/api/execute', verifyFirebaseToken, async (req, res) => {
  const { language, code, stdin } = req.body;
  const result = await executeCode(language, code, stdin);
  res.json(result);
});

app.post('/api/terminal', verifyFirebaseToken, (req, res) => {
  const { command } = req.body;
  const child = spawn(command, { shell: true });
  
  let stdoutData = "";
  let stderrData = "";

  child.stdout.on('data', d => stdoutData += d.toString());
  child.stderr.on('data', d => stderrData += d.toString());
  
  child.on('close', code => {
     res.json({
      stdout: stdoutData,
      stderr: stderrData,
      exit_code: code
    });
  });
  
  child.on('error', err => {
     res.json({ error: err.message });
  });
});

app.get('/api/languages', (req, res) => {
  res.json({
    languages: [
      { id: "python", name: "Python" },
      { id: "javascript", name: "JavaScript" },
      { id: "typescript", name: "TypeScript" },
      { id: "java", name: "Java" },
      { id: "cpp", name: "C++" },
      { id: "c", name: "C" },
      { id: "csharp", name: "C#" }
    ]
  });
});

app.get('/api/check-docker', (req, res) => {
  const dockerCommands = [
    'docker',
    'docker.exe',
    '"C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe"',
    '"C:\\Program Files (x86)\\Docker\\Docker\\resources\\bin\\docker.exe"',
    '/usr/bin/docker',
    '/usr/local/bin/docker',
    '/snap/bin/docker'
  ];
  
  let checked = 0;
  let found = false;
  
  for (const cmd of dockerCommands) {
    exec(`${cmd} --version`, (error, stdout, stderr) => {
      checked++;
      if (!error && (stdout.includes('Docker') || stderr.includes('Docker'))) {
        found = true;
      }
      
      if (checked === dockerCommands.length) {
        res.json({ installed: found });
      }
    });
  }
});

app.post('/api/export-zip', async (req, res) => {
  const { files, sessionName } = req.body;
  
  if (!files || typeof files !== 'object') {
    return res.status(400).json({ error: 'Invalid files data' });
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  
  res.attachment(`${sessionName || 'codeforge'}-source.zip`);
  
  archive.pipe(res);
  
  for (const [fileName, content] of Object.entries(files)) {
    archive.append(content || '', { name: fileName });
  }
  
  await archive.finalize();
});

app.post('/api/check-email', async (req, res) => {
  if (!FIREBASE_INITIALIZED) return res.json({ exists: true });

  const { email } = req.body;
  try {
    await admin.auth().getUserByEmail(email);
    res.json({ exists: true });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      res.json({ exists: false });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

// =============================================================================
// Main
// =============================================================================

async function main() {
  try {
    const port = await findFreePort(CONFIG.port);
    CONFIG.port = port;

    const rootDir = path.resolve(__dirname, '..');
    fs.writeFileSync(path.join(rootDir, '.backend_port'), port.toString());

    const frontendEnv = path.join(rootDir, 'frontend', '.env');
    if (fs.existsSync(frontendEnv)) {
      try {
        let content = fs.readFileSync(frontendEnv, 'utf8');
        const newLine = `NEXT_PUBLIC_BACKEND_URL=http://localhost:${port}`;
        if (content.includes('NEXT_PUBLIC_BACKEND_URL=')) {
          content = content.replace(/NEXT_PUBLIC_BACKEND_URL=.*/, newLine);
        } else {
          content += `\n${newLine}\n`;
        }
        fs.writeFileSync(frontendEnv, content);
        console.log(`📝 Updated ${frontendEnv} with port ${port}`);
      } catch (e) {
        console.warn(`⚠️  Could not update frontend/.env: ${e.message}`);
      }
    }

    server.listen(port, CONFIG.host, () => {
      console.log(`🚀 CodeForge Backend (Node.js) starting on port ${port}...`);
    });
  } catch (e) {
    console.error(`❌ Failed to start backend: ${e.message}`);
    process.exit(1);
  }
}

main();
