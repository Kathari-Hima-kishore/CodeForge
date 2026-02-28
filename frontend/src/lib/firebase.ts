import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration - set these in .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Backend URL - dynamically use current hostname for network access
// In development: uses the same host as the page (works for both localhost and network IP)
function getBackendUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:5001';
  
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const backendPort = envUrl ? new URL(envUrl).port || '5001' : '5001';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For DevTunnels pattern like "xxx-9002.inc1.devtunnels.ms", replace port in subdomain
  const portMatch = hostname.match(/-\d+\./);
  let finalHostname = hostname;
  
  if (portMatch) {
    // DevTunnels/ngrok style - replace port in subdomain
    finalHostname = hostname.replace(portMatch[0], `-${backendPort}.`);
    return `${protocol}//${finalHostname}`;
  }
  
  // Local development style - use port from env or default
  return `${protocol}//${hostname}:${backendPort}`;
}

export const BACKEND_URL = getBackendUrl();

// Alias for backwards compatibility
export const getDynamicBackendUrl = getBackendUrl;

// Initialize Firebase only once
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
