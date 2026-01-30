import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        setSupabaseUser(session.user);
        
        // Fetch full profile from DB
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: profile?.hunter_name || session.user.user_metadata?.display_name || 'User',
          level: profile?.level || 1,
          exp: profile?.exp || 0,
          coins: profile?.coins || 0,
          gems: profile?.gems || 0,
          current_class: profile?.current_class,
          gender: profile?.gender,
          onboarding_completed: profile?.onboarding_completed,
          cosmetics: [], // Need to fetch cosmetics separately or via join
          submittedIds: [],
          slotsUsed: 0,
          createdAt: new Date(profile?.created_at || new Date()),
          updatedAt: new Date(profile?.updated_at || new Date()),
          current_hp: profile?.current_hp,
          max_hp: profile?.max_hp,
          current_mp: profile?.current_mp,
          max_mp: profile?.max_mp,
          profilePicture: profile?.avatar ? { uri: profile.avatar } : require('../../assets/sungjinwoo.png'), // Handle avatar URL or local asset
        } as User);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session) {
             const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

             setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.hunter_name || session.user.user_metadata?.display_name || 'User',
              level: profile?.level || 1,
              exp: profile?.exp || 0,
              coins: profile?.coins || 0,
              gems: profile?.gems || 0,
              current_class: profile?.current_class,
              gender: profile?.gender,
              onboarding_completed: profile?.onboarding_completed,
              cosmetics: [],
              submittedIds: [],
              slotsUsed: 0,
              createdAt: new Date(profile?.created_at || new Date()),
              updatedAt: new Date(profile?.updated_at || new Date()),
              current_hp: profile?.current_hp,
              max_hp: profile?.max_hp,
              current_mp: profile?.current_mp,
              max_mp: profile?.max_mp,
              profilePicture: profile?.avatar ? { uri: profile.avatar } : require('../../assets/sungjinwoo.png'),
            } as User);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithOtp = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, isLoading, signInWithOtp, verifyOtp, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
