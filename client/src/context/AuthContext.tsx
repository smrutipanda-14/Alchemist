import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

export interface GameData {
  id: number;
  xp: number;
  level: number;
  gold: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  rarity: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  pfpPath: string;
  bannerPath: string;
  bio: string;
  isEmailVerified: boolean;
  streak: number;
  gameData?: GameData;
  badges?: Badge[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateGameStats: (gameData: Partial<GameData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('alchemist_token'));
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.error('Failed to load profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('alchemist_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('alchemist_token');
    setToken(null);
    setUser(null);
  };

  const updateGameStats = (updated: Partial<GameData>) => {
    if (!user || !user.gameData) return;
    setUser({
      ...user,
      gameData: {
        ...user.gameData,
        ...updated
      }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile, updateGameStats }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
