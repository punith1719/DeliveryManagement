import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, Driver } from '@/lib/supabase';

type AuthContextType = {
  driver: Driver | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<Driver | null>;
  logout: () => void;
   setDriver: React.Dispatch<React.SetStateAction<Driver | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

 const login = async (username: string, password: string): Promise<Driver | null> => {
  try {
    console.log('Login attempt:', { username });

    const { data, error } = await supabase
      .from('drivers')
      .select('id, username, full_name, phone, role, password, created_at')
      .eq('username', username)
      .eq('password', password)
      .maybeSingle();

    console.log('Login result:', { data, error });

    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (!data) {
      console.log('No user found with these credentials');
      return null;
    }

    console.log('Login successful:', data.username, data.role);
    setDriver(data);
    return data;
  } catch (error) {
    console.error('Login exception:', error);
    return null;
  }
};


  const logout = () => {
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, loading, login, logout, setDriver, }}>
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
