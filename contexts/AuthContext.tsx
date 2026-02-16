import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/db';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'viveksharma2482@gmail.com';

interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check database for existing session on load
    const storedUser = db.getUser();
    if (storedUser) {
      // Ensure isAdmin is set correctly based on email if it wasn't before
      if (storedUser.email === ADMIN_EMAIL && !storedUser.isAdmin) {
        storedUser.isAdmin = true;
      }
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = db.verifyCredentials(email, password);
    
    if (!foundUser) {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }

    // Force admin status if email matches
    if (foundUser.email === ADMIN_EMAIL) {
      foundUser.isAdmin = true;
    }

    setUser(foundUser);
    db.saveUser(foundUser);
    setIsLoading(false);
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      // SECURITY NOTE:
      // In a production app with a backend, you must send this 'credential' (ID Token)
      // to your backend server. The backend should verify the signature against Google's
      // public keys using a library like 'google-auth-library'.
      //
      // Since this is a client-side only application for demonstration:
      // We decode the JWT locally to extract user info. We trust the token because
      // it was just received from the Google iframe.
      
      const decoded: GoogleJwtPayload = jwtDecode(credential);
      const { email, name, picture } = decoded;
      
      let appUser = db.findUserByEmail(email);

      if (!appUser) {
        // User doesn't exist, create account (Auto-Registration)
        const newUser = {
          id: 'usr_g_' + Date.now(),
          name: name,
          email: email,
          password: '', // OAuth users have no password
          avatar: picture,
          isAdmin: email === ADMIN_EMAIL
        };
        db.createAccount(newUser);
        appUser = newUser;
      } else {
        // Existing user, update avatar if needed
        // (In a real app, you might merge accounts)
      }

      // Force admin check
      if (appUser.email === ADMIN_EMAIL) {
        appUser.isAdmin = true;
      }

      setUser(appUser);
      db.saveUser(appUser);
    } catch (error) {
      console.error("Google Login Failed", error);
      throw new Error("Failed to authenticate with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const newUser = {
        id: 'usr_' + Date.now(),
        name,
        email,
        password, // In a real app, never store plain text passwords
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`,
        isAdmin: email === ADMIN_EMAIL
      };

      db.createAccount(newUser);
      
      // Auto login after register
      const { password: _, ...userSession } = newUser;
      setUser(userSession as User);
      db.saveUser(userSession as User);
      
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    db.clearUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};