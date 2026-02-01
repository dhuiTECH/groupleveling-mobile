import React, { useEffect, createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '../types/user';

export const resolveAvatar = (avatar: string | null) => {
  if (!avatar) return require('../../assets/sungjinwoo.png');
  if (avatar.startsWith('http')) return { uri: avatar };
  
  // Handle local assets
  const cleanName = avatar.replace(/^\//, '');
  switch (cleanName) {
    case 'NoobMan.png':
    case 'NoobMan':
      return require('../../assets/NoobMan.png');
    case 'NoobWoman.png':
    case 'NoobWoman':
      return require('../../assets/NoobWoman.png');
    case 'Noobnonbinary.png':
    case 'Noobnonbinary':
      return require('../../assets/Noobnonbinary.png');
    default:
      return { uri: avatar };
  }
};

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  isLoading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  checkProfileExists: (identifier: string) => Promise<any>;
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
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select(`
              *,
              cosmetics:user_cosmetics(
                id,
                equipped,
                shop_item_id,
                created_at:acquired_at,
                shop_items:shop_item_id(*)
              )
            `)
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profile.hunter_name || session.user.user_metadata?.display_name || 'User',
              level: profile.level || 1,
              exp: Number(profile.exp) || 0,
              coins: Number(profile.coins) || 0,
              gems: profile.gems || 0,
              current_class: profile.current_class,
              gender: profile.gender,
              onboarding_completed: profile.onboarding_completed,
              cosmetics: profile.cosmetics || [],
              submittedIds: [],
              slotsUsed: 0,
              createdAt: new Date(profile.created_at || new Date()),
              updatedAt: new Date(profile.updated_at || new Date()),
              current_hp: profile.current_hp,
              max_hp: profile.max_hp,
              current_mp: profile.current_mp,
              max_mp: profile.max_mp,
              profilePicture: resolveAvatar(profile.avatar),
            } as User);
          }
        } catch (err) {
          console.error('Fatal error in getInitialSession:', err);
        }
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSupabaseUser(session?.user ?? null);
        if (session) {
          try {
             const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select(`
                  *,
                  cosmetics:user_cosmetics(
                    id,
                    equipped,
                    shop_item_id,
                    created_at:acquired_at,
                    shop_items:shop_item_id(*)
                  )
                `)
                .eq('id', session.user.id)
                .single();

             if (profileError) {
               console.error('Error fetching profile in onAuthStateChange:', profileError);
             }

             if (profile) {
               setUser({
                id: session.user.id,
                email: session.user.email || '',
                name: profile.hunter_name || session.user.user_metadata?.display_name || 'User',
                level: profile.level || 1,
                exp: Number(profile.exp) || 0,
                coins: Number(profile.coins) || 0,
                gems: profile.gems || 0,
                current_class: profile.current_class,
                gender: profile.gender,
                onboarding_completed: profile.onboarding_completed,
                cosmetics: profile.cosmetics || [],
                submittedIds: [],
                slotsUsed: 0,
                createdAt: new Date(profile.created_at || new Date()),
                updatedAt: new Date(profile.updated_at || new Date()),
                current_hp: profile.current_hp,
                max_hp: profile.max_hp,
                current_mp: profile.current_mp,
                max_mp: profile.max_mp,
                profilePicture: resolveAvatar(profile.avatar),
              } as User);
             }
          } catch (err) {
            console.error('Fatal error in onAuthStateChange:', err);
          }
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
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  const checkProfileExists = async (identifier: string): Promise<any> => {
    // Check by email or hunter_name
    const { data: profileByEmail } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', identifier)
      .single();

    if (profileByEmail) return profileByEmail;

    const { data: profileByName } = await supabase
      .from('profiles')
      .select('*')
      .eq('hunter_name', identifier)
      .single();

    return profileByName;
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, isLoading, signInWithOtp, verifyOtp, logout, setUser, checkProfileExists }}>
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
