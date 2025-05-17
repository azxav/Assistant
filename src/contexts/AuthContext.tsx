
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User, AuthError, SignUpWithPasswordCredentials } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  login: (credentials: SignUpWithPasswordCredentials) => Promise<void>;
  signup: (credentials: SignUpWithPasswordCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const getSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError(sessionError);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, sessionState: Session | null) => {
        setSession(sessionState);
        setUser(sessionState?.user ?? null);
        setLoading(false);
        if (event === 'SIGNED_IN' && sessionState) {
           // router.push('/dashboard'); // Handled by page/layout checks
        }
        if (event === 'SIGNED_OUT') {
          // router.push('/auth/login'); // Handled by page/layout checks
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const login = async (credentials: SignUpWithPasswordCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword(credentials);
      if (loginError) throw loginError;
      // The onAuthStateChange listener will handle setting user/session and navigation
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: SignUpWithPasswordCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signupError } = await supabase.auth.signUp(credentials);
      if (signupError) throw signupError;
      // Supabase default behavior: sends confirmation email. User needs to confirm.
      // For now, we'll rely on onAuthStateChange.
      // If auto-confirm is on or no email confirmation, user might be logged in.
      // The onAuthStateChange listener will handle setting user/session
      alert('Signup successful! Please check your email to confirm your account if required.');
    } catch (e: any) {
      console.error('Signup error:', e);
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      setUser(null);
      setSession(null);
      router.push('/auth/login'); // Explicit redirect on logout
    } catch (e: any) {
      console.error('Logout error:', e);
      setError(e as AuthError);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
