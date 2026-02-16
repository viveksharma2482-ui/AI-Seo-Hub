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
    try {
      const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
      if (accounts.find((u: any) => u.email === user.email)) {
        throw new Error('User with this email already exists');
      }
      // Add creation timestamp
      const newUser = { 
        ...user, 
        id: user.id || 'usr_' + Date.now(), // Ensure ID exists
        createdAt: new Date().toISOString() 
      };
      accounts.push(newUser);
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
      return newUser;
    } catch (e) {
      console.error("Database Error (createAccount):", e);
      throw e;
    }
  },

  getAllUsers: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    } catch (e) {
      return [];
    }
  },

  findUserByEmail: (email: string): User | null => {
    try {
      const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
      const account = accounts.find((u: any) => u.email === email);
      if (!account) return null;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = account;
      return userWithoutPassword as User;
    } catch (e) {
      return null;
    }
  },

  deleteUser: (userId: string, email?: string) => {
    let accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    accounts = accounts.filter((u: any) => {
      // If we have an ID match, delete it (return false)
      if (userId && u.id === userId) return false;
      // Fallback: If we have an email match and no ID was found/passed, delete it
      if (email && u.email === email) return false;
      // Keep the user
      return true;
    });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  verifyCredentials: (email: string, password: string): User | null => {
    try {
      const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
      const account = accounts.find((u: any) => u.email === email && u.password === password);
      if (!account) return null;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = account;
      return userWithoutPassword as User;
    } catch (e) {
      return null;
    }
  },

  // User Operations (Current Session)
  saveUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  getUser: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  clearUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Audit Operations
  saveAudit: (audit: SiteAuditResult) => {
    try {
      // Use getAudits to safely parse existing data
      const audits = db.getAudits();
      
      // Add ID if missing
      if (!audit.id) {
        audit.id = 'audit_' + Date.now();
      }
      
      // Add to beginning and LIMIT to 50 items to prevent LocalStorage quota exceeded errors
      const newAudits = [audit, ...audits].slice(0, 50);
      
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(newAudits));
      return newAudits;
    } catch (e) {
      console.error("Failed to save audit - Storage might be full", e);
      // Try to save at least the new one if possible, or just fail gracefully
      return [];
    }
  },

  getAudits: (userId?: string): SiteAuditResult[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
      const allAudits = data ? JSON.parse(data) : [];
      if (userId) {
          return allAudits.filter((a: any) => a.userId === userId);
      }
      return allAudits;
    } catch (e) {
      console.error("Error reading audits DB", e);
      return [];
    }
  },

  getLatestAudit: (userId?: string): SiteAuditResult | null => {
    const audits = db.getAudits(userId);
    return audits.length > 0 ? audits[0] : null;
  },

  clearAudits: () => {
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
  },

  // Admin / System Stats Simulation (Using Real Data)
  getSystemStats: () => {
    const realAudits = db.getAudits(); // Get ALL audits for admin stats
    const realUsers = db.getAllUsers();
    
    // Calculate simple activity data (audits per day - mocked distribution based on real count)
    const totalAudits = realAudits.length;
    
    return {
      totalUsers: realUsers.length,
      totalAudits: totalAudits,
      activeToday: 1, // At least the current admin
      users: realUsers.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    };
  },

  // Dangerous Operation
  resetDatabase: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Data Persistence (Backup/Restore)
  exportData: () => {
    return {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]'),
      audits: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDITS) || '[]'),
      exportedAt: new Date().toISOString()
    };
  },

  importData: (jsonData: any) => {
    if (jsonData.users && Array.isArray(jsonData.users)) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(jsonData.users));
    }
    if (jsonData.audits && Array.isArray(jsonData.audits)) {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(jsonData.audits));
    }
  }
};