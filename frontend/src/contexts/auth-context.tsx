'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, BACKEND_URL, getDynamicBackendUrl } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch(`${getDynamicBackendUrl()}/api/check-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to verify email');
    }
    
    const data = await response.json();
    return data.exists === true;
  } catch (err) {
    if (err instanceof Error && err.message !== 'Failed to verify email') {
      throw err;
    }
    throw new Error('Connection to authentication server failed');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    
    try {
      // First check if email exists in Firebase
      const emailExists = await checkEmailExists(email);
      
      // If email doesn't exist, show specific error
      if (!emailExists) {
        const errorMsg = 'Email is not registered';
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }
      
      // Email exists, now verify password
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      
      // Handle Firebase auth errors - wrong password for existing email
      if (firebaseError.code === 'auth/invalid-credential' || 
          firebaseError.code === 'auth/wrong-password') {
        const errorMsg = 'Incorrect password';
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }

      if (firebaseError.code === 'auth/invalid-email') {
        const errorMsg = 'Invalid email address';
        setError(errorMsg);
        setLoading(false);
        throw new Error(errorMsg);
      }
      
      // Re-throw our custom errors if already caught above but somehow reached here
      if (err instanceof Error && (err.message === 'Email is not registered' || err.message === 'Incorrect password')) {
        setLoading(false);
        throw err;
      }
      
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setError(null);
    setLoading(true);
    
    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      setLoading(false);
      throw new Error(passwordError);
    }
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered');
      }
      if (firebaseError.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      if (firebaseError.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      }
      
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password reset failed';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
