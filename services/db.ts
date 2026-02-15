import { SiteAuditResult, User } from '../types';

const STORAGE_KEYS = {
  AUDITS: 'seo_audits_db',
  USER: 'seo_user_db',
  ACCOUNTS: 'seo_accounts_db'
};

/**
 * A local database service using localStorage to simulate a backend database.
 * This persists user sessions and audit history.
 */
export const db = {
  // Account Operations (Registered Users)
  createAccount: (user: any) => {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    if (accounts.find((u: any) => u.email === user.email)) {
      throw new Error('User with this email already exists');
    }
    // Add creation timestamp
    const newUser = { 
      ...user, 
      createdAt: new Date().toISOString() 
    };
    accounts.push(newUser);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return newUser;
  },

  getAllUsers: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  },

  findUserByEmail: (email: string): User | null => {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    const account = accounts.find((u: any) => u.email === email);
    if (!account) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = account;
    return userWithoutPassword as User;
  },

  deleteUser: (userId: string) => {
    let accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    accounts = accounts.filter((u: any) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  verifyCredentials: (email: string, password: string): User | null => {
    const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    const account = accounts.find((u: any) => u.email === email && u.password === password);
    if (!account) return null;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = account;
    return userWithoutPassword as User;
  },

  // User Operations (Current Session)
  saveUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Audit Operations
  saveAudit: (audit: SiteAuditResult) => {
    const audits = db.getAudits();
    // Add to beginning, limit to last 50 entries to manage storage
    const newAudits = [audit, ...audits].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(newAudits));
    return newAudits;
  },

  getAudits: (): SiteAuditResult[] => {
    const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return data ? JSON.parse(data) : [];
  },

  getLatestAudit: (): SiteAuditResult | null => {
    const audits = db.getAudits();
    return audits.length > 0 ? audits[0] : null;
  },

  clearAudits: () => {
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
  },

  // Admin / System Stats Simulation (Using Real Data)
  getSystemStats: () => {
    const realAudits = db.getAudits();
    const realUsers = db.getAllUsers();
    
    // Calculate simple activity data (audits per day - mocked distribution based on real count)
    const totalAudits = realAudits.length;
    
    return {
      totalUsers: realUsers.length,
      totalAudits: totalAudits,
      activeToday: 1, // At least the current admin
      users: realUsers.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    };
  }
};