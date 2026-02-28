'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL, getDynamicBackendUrl, auth, db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';
import { useAuth } from './auth-context';

// Types
export type Role = 'host' | 'co-host' | 'editor' | 'viewer';

export interface Participant {
  uid: string;
  name: string;
  email: string;
  role: Role;
  color: string;
  isOnline: boolean;
  photoURL?: string;
  joinedAt: number;
}

export interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
  isFolder?: boolean;
  parentId?: string | null;
}

export interface ChatMessage {
  id: string;
  odor: string;
  userName: string;
  userColor: string;
  content: string;
  timestamp: number;
}

export interface OutputItem {
  type: 'output' | 'error' | 'info' | 'success';
  content: string;
  timestamp: number;
}

export interface SessionData {
  sessionId: string;
  name: string;
  hostId: string;
  hostName: string;
  createdAt: Timestamp | null;
  participants: Record<string, Participant>;
  files: FileItem[];
  messages: ChatMessage[];
  isActive: boolean;
}

export interface Session {
  sessionId: string;
  name: string;
  role: Role;
  hostId: string;
  hostName: string;
  participants: Record<string, Participant>;
}

// Summary for session list
export interface SessionSummary {
  sessionId: string;
  name: string;
  hostName: string;
  participantCount: number;
  createdAt: number;
  isHost: boolean;
}

interface SessionContextType {
  // Session state
  session: Session | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // User's existing sessions
  mySessions: SessionSummary[];
  isLoadingSessions: boolean;
  refreshMySessions: () => Promise<void>;

  // File management
  files: FileItem[];
  currentFileId: string | null;
  setCurrentFileId: (id: string) => void;
  createFile: (name: string, language: string, parentId?: string | null) => void;
  updateFileContent: (id: string, content: string) => void;
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  
  // Folder management
  createFolder: (name: string, parentId?: string | null) => void;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;

  // Chat
  messages: ChatMessage[];
  sendMessage: (content: string) => void;

  // Output
  output: OutputItem[];
  clearOutput: () => void;
  addOutput: (type: OutputItem['type'], content: string) => void;

  // Code execution
  isExecuting: boolean;
  executeCode: (language: string, code: string) => void;

  // Session actions
  createSession: (name: string) => Promise<void>;
  joinSession: (sessionId: string) => Promise<void>;
  rejoinSession: (sessionId: string) => Promise<void>;
  leaveSession: () => Promise<void>;

  // User management (host only)
  changeUserRole: (userId: string, role: Role) => Promise<void>;
  kickUser: (userId: string) => Promise<void>;

  // Terminal
  sendTerminalCommand: (command: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Helper to generate random ID
function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to generate random color
function generateColor(): string {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308',
    '#84cc16', '#22c55e', '#10b981', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [mySessions, setMySessions] = useState<SessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [output, setOutput] = useState<OutputItem[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch user's existing sessions using a direct query on the sessions collection
  useEffect(() => {
    if (!user) {
      setMySessions([]);
      return;
    }

    setIsLoadingSessions(true);

    // Query for sessions where user is the host
    // Simplified to avoid complex indexes
    const hostQuery = query(
      collection(db, 'sessions'),
      where('hostId', '==', user.uid)
    );

    // Query for sessions where user is a participant
    const participantQuery = query(
      collection(db, 'sessions'),
      where(`participants.${user.uid}.uid`, '==', user.uid)
    );

    const unsubscribeHost = onSnapshot(hostQuery, (snapshot) => {
      const hostSessions = snapshot.docs
        .map(doc => doc.data() as SessionData)
        .filter(data => data.isActive) // Filter in memory
        .map(data => {
          return {
            sessionId: data.sessionId,
            name: data.name,
            hostName: data.hostName,
            participantCount: Object.keys(data.participants || {}).length,
            createdAt: data.createdAt?.toMillis() || Date.now(),
            isHost: true,
          };
        });

      setMySessions(prev => {
        const otherSessions = prev.filter(s => !s.isHost);
        const combined = [...hostSessions, ...otherSessions];
        return combined.sort((a, b) => b.createdAt - a.createdAt);
      });
      setIsLoadingSessions(false);
    }, (err) => {
      console.error("Error listening to host sessions:", err);
      setIsLoadingSessions(false);
    });

    const unsubscribeParticipant = onSnapshot(participantQuery, (snapshot) => {
      const partSessions = snapshot.docs
        .map(doc => doc.data() as SessionData)
        .filter(data => data.isActive && data.hostId !== user.uid) // Filter in memory
        .map(data => {
          return {
            sessionId: data.sessionId,
            name: data.name,
            hostName: data.hostName,
            participantCount: Object.keys(data.participants || {}).length,
            createdAt: data.createdAt?.toMillis() || Date.now(),
            isHost: false,
          };
        });

      setMySessions(prev => {
        const myHostSessions = prev.filter(s => s.isHost);
        const combined = [...myHostSessions, ...partSessions];
        return combined.sort((a, b) => b.createdAt - a.createdAt);
      });
    }, (err) => {
      console.error("Error listening to participant sessions:", err);
    });

    return () => {
      unsubscribeHost();
      unsubscribeParticipant();
    };
  }, [user]);

  // Keep refreshMySessions for compatibility, though the useEffect handles it now
  const refreshMySessions = useCallback(async () => {
    // The useEffect listener above handles real-time updates now
  }, []);

  // Listen to session changes in Firestore
  useEffect(() => {
    if (!session?.sessionId || !user) return;

    const sessionRef = doc(db, 'sessions', session.sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as SessionData;

        // Update participants
        const myRole = data.participants[user.uid]?.role || 'viewer';
        setSession(prev => prev ? {
          ...prev,
          participants: data.participants,
          role: myRole,
        } : null);

        // Update files
        if (data.files?.length > 0) {
          setFiles(data.files);
        }

        // Update messages
        if (data.messages) {
          setMessages(data.messages);
        }

        // Check if we were kicked
        if (!data.participants[user.uid] && data.hostId !== user.uid) {
          setSession(null);
          setConnectionError('You have been removed from the session.');
        }
      } else {
        // Session was deleted
        setSession(null);
        setConnectionError('Session has ended.');
      }
    });

    return () => unsubscribe();
  }, [session?.sessionId, user]);

  // Update online status
  useEffect(() => {
    if (!session?.sessionId || !user) return;

    const updateOnlineStatus = async (isOnline: boolean) => {
      try {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        await updateDoc(sessionRef, {
          [`participants.${user.uid}.isOnline`]: isOnline,
        });
      } catch (e) {
        // Ignore errors on cleanup
      }
    };

    updateOnlineStatus(true);

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateOnlineStatus(false);
    };
  }, [session?.sessionId, user]);

  // File management
  const createFile = useCallback((name: string, language: string, parentId: string | null = null) => {
    const newFile: FileItem = {
      id: generateId(12),
      name,
      content: '',
      language,
      isFolder: false,
      parentId,
    };
    setFiles(prev => {
      const updated = [...prev, newFile];
      // Sync to Firestore if in session
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
    setCurrentFileId(newFile.id);
  }, [session?.sessionId]);

  // Debounce ref for Firestore writes (free tier optimization)
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, content } : f);
      
      // Debounce Firestore writes (500ms) - critical for free tier
      if (session?.sessionId) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          const sessionRef = doc(db, 'sessions', session.sessionId);
          updateDoc(sessionRef, { files: updated });
        }, 500);
      }
      return updated;
    });
  }, [session?.sessionId]);

  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (currentFileId === id && updated.length > 0) {
        setCurrentFileId(updated[0].id);
      }
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
  }, [currentFileId, session?.sessionId]);

  const renameFile = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, name: newName } : f);
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
  }, [session?.sessionId]);

  // Folder management
  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const newFolder: FileItem = {
      id: generateId(12),
      name,
      content: '',
      language: '',
      isFolder: true,
      parentId,
    };
    setFiles(prev => {
      const updated = [...prev, newFolder];
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
  }, [session?.sessionId]);

  const renameFolder = useCallback((id: string, newName: string) => {
    setFiles(prev => {
      const updated = prev.map(f => f.id === id ? { ...f, name: newName } : f);
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
  }, [session?.sessionId]);

  const deleteFolder = useCallback((id: string) => {
    setFiles(prev => {
      const getAllDescendantIds = (folderId: string): string[] => {
        const children = prev.filter(f => f.parentId === folderId);
        let ids = children.map(f => f.id);
        children.forEach(child => {
          if (child.isFolder) {
            ids = [...ids, ...getAllDescendantIds(child.id)];
          }
        });
        return ids;
      };
      
      const idsToDelete = new Set([id, ...getAllDescendantIds(id)]);
      const updated = prev.filter(f => !idsToDelete.has(f.id));
      
      if (currentFileId && idsToDelete.has(currentFileId)) {
        const remaining = updated.filter(f => !f.isFolder);
        setCurrentFileId(remaining.length > 0 ? remaining[0].id : null);
      }
      
      if (session?.sessionId) {
        const sessionRef = doc(db, 'sessions', session.sessionId);
        updateDoc(sessionRef, { files: updated });
      }
      return updated;
    });
  }, [currentFileId, session?.sessionId]);

  // Chat
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !session?.sessionId) return;

    const myParticipant = session.participants[user.uid];
    const newMessage: ChatMessage = {
      id: generateId(16),
      odor: user.uid,
      userName: myParticipant?.name || user.displayName || 'Anonymous',
      userColor: myParticipant?.color || '#3b82f6',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => {
      const updated = [...prev, newMessage];
      // Sync to Firestore
      const sessionRef = doc(db, 'sessions', session.sessionId);
      updateDoc(sessionRef, { messages: updated });
      return updated;
    });
  }, [user, session]);

  // Output
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);

  const addOutput = useCallback((type: OutputItem['type'], content: string) => {
    setOutput(prev => [...prev, { type, content, timestamp: Date.now() }]);
  }, []);

  // Socket.IO connection management
  useEffect(() => {
    if (!user) return;

    // Use dynamic URL that works for localhost, LAN, DevTunnels, ngrok
    const socketUrl = getDynamicBackendUrl();
    console.log('🔌 Connecting to backend:', socketUrl);

    // Create socket connection
    const newSocket = io(socketUrl, {
      auth: {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0] || 'User'
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to backend');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from backend');
    });

    newSocket.on('connect_error', (error) => {
      setIsConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
      console.error('Connection error:', error);
    });

    // Handle code execution results (from other users)
    newSocket.on('execution_result', (data) => {
      // Backend returns: stdout, stderr, exit_code, execution_time, executed_by, or error
      const executor = data.executed_by ? `[${data.executed_by}] ` : '';
      if (data.error) {
        addOutput('error', `${executor}❌ Execution Error: ${data.error}`);
      } else {
        if (data.stdout) {
          addOutput('output', data.stdout);
        }
        if (data.stderr) {
          addOutput('error', data.stderr);
        }
        if (!data.stdout && !data.stderr) {
          const time = typeof data.execution_time === 'number' ? data.execution_time.toFixed(3) : '0';
          addOutput('success', `${executor}✓ Code executed in ${time}s (no output)`);
        }
      }
    });

    // Handle terminal output
    newSocket.on('terminal_output', (data) => {
      addOutput('output', data.output);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user, addOutput]);

  // Join session via Socket.IO when session changes
  useEffect(() => {
    if (!socket || !session?.sessionId || !user) return;

    // Simplified join object
    const joinData = {
      session_id: session.sessionId, // Backend expects snake_case for some fields, verify? No, backend uses data.get('session_id')
      sessionId: session.sessionId, // Sending both to be safe given inconsistency risks
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'User',
      userEmail: user.email
    };

    socket.emit('join_session', joinData, (response: any) => {
      if (response?.error === 'Session not found') {
        console.log('Session not found on backend. Attempting resurrection...');
        // Check if we are host based on Firestore data
        if (session.hostId === user.uid) {
          socket.emit('create_session', {
            settings: { name: session.name },
            session_id: session.sessionId // Pass existing ID to resurrection
          }, (createRes: any) => {
            if (createRes?.success) {
              addOutput('success', '🔄 Session restored on server.');
            } else {
              addOutput('error', `❌ Failed to restore session: ${createRes?.error}`);
            }
          });
        } else {
          addOutput('error', '❌ Session has ended (Host disconnected).');
        }
      } else if (response?.error) {
        console.error('Join failed:', response.error);
      }
    });

    return () => {
      if (socket && session?.sessionId) {
        socket.emit('leave_session', { sessionId: session.sessionId });
      }
    };
  }, [socket, session?.sessionId, user]);

  // Code execution
  const executeCode = useCallback((language: string, code: string) => {
    if (!socket || !isConnected) {
      addOutput('error', '❌ Not connected to backend server');
      return;
    }

    setIsExecuting(true);
    addOutput('info', `⏳ Running ${language} code...`);

    try {
      let isDone = false;
      
      const timeoutId = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          setIsExecuting(false);
          addOutput('error', '❌ Execution timed out (No response from backend)');
        }
      }, 35000); // slightly longer than backend timeout (30s)

      socket.emit('run_code', {
        sessionId: session?.sessionId || 'standalone',
        language,
        code
      }, (response: any) => {
        if (isDone) return;
        isDone = true;
        clearTimeout(timeoutId);
        setIsExecuting(false);

        if (response?.error) {
          addOutput('error', `❌ Execution Error: ${response.error}`);
        } else {
          if (response.stdout) {
            addOutput('output', response.stdout);
          }
          if (response.stderr) {
            addOutput('error', response.stderr);
          }
          if (!response.stdout && !response.stderr) {
            const time = typeof response.execution_time === 'number' ? response.execution_time.toFixed(3) : '0';
            addOutput('success', `✓ Code executed in ${time}s (no output)`);
          }
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addOutput('error', `❌ Failed to send execution request: ${message}`);
      setIsExecuting(false);
    }
  }, [socket, isConnected, session?.sessionId, addOutput]);

  // Create a new session
  const createSession = useCallback(async (name: string) => {
    if (!user) {
      setConnectionError('You must be logged in to create a session');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const sessionId = generateId(8);
      const myColor = generateColor();

      const participant: Participant = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Host',
        email: user.email || '',
        role: 'host',
        color: myColor,
        isOnline: true,
        ...(user.photoURL && { photoURL: user.photoURL }),
        joinedAt: Date.now(),
      };

      const sessionData: SessionData = {
        sessionId,
        name,
        hostId: user.uid,
        hostName: participant.name,
        createdAt: serverTimestamp() as Timestamp,
        participants: { [user.uid]: participant },
        files: files,
        messages: [],
        isActive: true,
      };

      // Create session in Firestore
      await setDoc(doc(db, 'sessions', sessionId), sessionData);

      setSession({
        sessionId,
        name,
        role: 'host',
        hostId: user.uid,
        hostName: participant.name,
        participants: { [user.uid]: participant },
      });

      addOutput('success', `🎉 Session "${name}" created! Share code: ${sessionId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create session';
      setConnectionError(message);
      addOutput('error', `❌ ${message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [user, files, addOutput]);

  // Join an existing session
  const joinSession = useCallback(async (sessionId: string) => {
    if (!user) {
      setConnectionError('You must be logged in to join a session');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const normalizedId = sessionId.toUpperCase().trim();
      const sessionRef = doc(db, 'sessions', normalizedId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        throw new Error('Session not found. Please check the session code.');
      }

      const data = sessionSnap.data() as SessionData;

      if (!data.isActive) {
        throw new Error('This session has ended.');
      }

      const myColor = generateColor();
      const participant: Participant = {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'editor', // Default role for new joiners
        color: myColor,
        isOnline: true,
        ...(user.photoURL && { photoURL: user.photoURL }),
        joinedAt: Date.now(),
      };

      // Add self to participants
      await updateDoc(sessionRef, {
        [`participants.${user.uid}`]: participant,
      });

      // Set local state
      const updatedParticipants = { ...data.participants, [user.uid]: participant };

      setSession({
        sessionId: normalizedId,
        name: data.name,
        role: 'editor',
        hostId: data.hostId,
        hostName: data.hostName,
        participants: updatedParticipants,
      });

      // Load session files
      if (data.files?.length > 0) {
        setFiles(data.files);
        setCurrentFileId(data.files[0].id);
      }

      // Load messages
      if (data.messages) {
        setMessages(data.messages);
      }

      addOutput('success', `🎉 Joined session "${data.name}"!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join session';
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [user, addOutput]);

  // Rejoin an existing session (for sessions user is already part of)
  const rejoinSession = useCallback(async (sessionId: string) => {
    if (!user) {
      setConnectionError('You must be logged in to rejoin a session');
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const normalizedId = sessionId.toUpperCase().trim();
      const sessionRef = doc(db, 'sessions', normalizedId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        throw new Error('Session no longer exists.');
      }

      const data = sessionSnap.data() as SessionData;

      if (!data.isActive) {
        throw new Error('This session has ended.');
      }

      // Check if user is already a participant
      const existingParticipant = data.participants[user.uid];
      const isHost = data.hostId === user.uid;

      if (!existingParticipant && !isHost) {
        throw new Error('You are no longer a member of this session.');
      }

      // Update online status
      await updateDoc(sessionRef, {
        [`participants.${user.uid}.isOnline`]: true,
      });

      // Determine role
      const myRole = isHost ? 'host' : (existingParticipant?.role || 'editor');

      setSession({
        sessionId: normalizedId,
        name: data.name,
        role: myRole,
        hostId: data.hostId,
        hostName: data.hostName,
        participants: data.participants,
      });

      // Load session files
      if (data.files?.length > 0) {
        setFiles(data.files);
        setCurrentFileId(data.files[0].id);
      }

      // Load messages
      if (data.messages) {
        setMessages(data.messages);
      }

      addOutput('success', `🎉 Rejoined session "${data.name}"!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rejoin session';
      setConnectionError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [user, addOutput]);

  // Leave the current session
  const leaveSession = useCallback(async () => {
    if (!session?.sessionId || !user) return;

    const sessionId = session.sessionId;

    try {
      const sessionRef = doc(db, 'sessions', sessionId);

      if (session.role === 'host') {
        await updateDoc(sessionRef, { isActive: false });
        await deleteDoc(sessionRef);
      } else {
        // Remove self from participants
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
          const data = sessionSnap.data() as SessionData;
          const { [user.uid]: _, ...remainingParticipants } = data.participants;
          await updateDoc(sessionRef, { participants: remainingParticipants });
        }
      }
    } catch (error) {
      console.error('Error leaving session:', error);
    } finally {
      setSession(null);
      setMessages([]);
      setOutput([]);
      setConnectionError(null);
      // Reset files to empty (user creates new file when needed)
      setFiles([]);
      setCurrentFileId(null);
      // Refresh sessions list
      refreshMySessions();
    }
  }, [session, user, refreshMySessions]);

  // Change user role (host/co-host only)
  const changeUserRole = useCallback(async (userId: string, role: Role) => {
    if (!session?.sessionId) return;
    if (session.role !== 'host' && session.role !== 'co-host') return;

    try {
      const sessionRef = doc(db, 'sessions', session.sessionId);
      await updateDoc(sessionRef, {
        [`participants.${userId}.role`]: role,
      });
    } catch (error) {
      console.error('Error changing role:', error);
    }
  }, [session]);

  // Kick user (host only)
  const kickUser = useCallback(async (userId: string) => {
    if (!session?.sessionId || session.role !== 'host') return;

    try {
      const sessionRef = doc(db, 'sessions', session.sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists()) {
        const data = sessionSnap.data() as SessionData;
        const { [userId]: _, ...remainingParticipants } = data.participants;
        await updateDoc(sessionRef, { participants: remainingParticipants });
      }
    } catch (error) {
      console.error('Error kicking user:', error);
    }
  }, [session]);

  // Terminal command
  const sendTerminalCommand = useCallback(async (command: string) => {
    if (!user || !command.trim()) return;

    // Optimistic update
    addOutput('output', `> ${command}`);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${getDynamicBackendUrl()}/api/terminal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          command,
          cwd: null // Optional: support current working directory tracking later
        })
      });

      const data = await response.json();

      if (data.stdout) addOutput('info', data.stdout);
      if (data.stderr) addOutput('error', data.stderr);
      if (data.error) addOutput('error', data.error);

    } catch (error) {
      console.error('Terminal error:', error);
      addOutput('error', 'Failed to send command');
    }
  }, [user, addOutput]);

  return (
    <SessionContext.Provider
      value={{
        session,
        isConnected,
        isConnecting,
        connectionError,
        mySessions,
        isLoadingSessions,
        refreshMySessions,
        files,
        currentFileId,
        setCurrentFileId,
        createFile,
        updateFileContent,
        renameFile,
        deleteFile,
        createFolder,
        renameFolder,
        deleteFolder,
        messages,
        sendMessage,
        output,
        clearOutput,
        addOutput,
        isExecuting,
        executeCode,
        createSession,
        joinSession,
        rejoinSession,
        leaveSession,
        changeUserRole,
        kickUser,
        sendTerminalCommand,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
