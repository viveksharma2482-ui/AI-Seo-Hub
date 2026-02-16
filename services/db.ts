import { SiteAuditResult, CompetitorAnalysisResult, HistoryItem, User } from '../types';

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

  // Audit & History Operations
  saveAudit: (item: HistoryItem) => {
    try {
      // Use getAudits to safely parse existing data
      const history = db.getAudits();
      
      // Add ID if missing
      if (!item.id) {
        item.id = (item.type === 'comparison' ? 'comp_' : 'audit_') + Date.now();
      }
      
      // Add to beginning and LIMIT to 50 items to prevent LocalStorage quota exceeded errors
      const newHistory = [item, ...history].slice(0, 50);
      
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(newHistory));
      return newHistory;
    } catch (e) {
      console.error("Failed to save history item - Storage might be full", e);
      // Try to save at least the new one if possible, or just fail gracefully
      return [];
    }
  },

  getAudits: (userId?: string): HistoryItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDITS);
      const allHistory = data ? JSON.parse(data) : [];
      if (userId) {
          return allHistory.filter((a: any) => a.userId === userId);
      }
      return allHistory;
    } catch (e) {
      console.error("Error reading history DB", e);
      return [];
    }
  },

  // Specifically gets the latest SITE AUDIT (ignoring comparisons) for the dashboard
  getLatestAudit: (userId?: string): SiteAuditResult | null => {
    const history = db.getAudits(userId);
    // Filter for type 'audit'
    const audits = history.filter((h): h is SiteAuditResult => h.type === 'audit' || h.type === undefined); // handle legacy data where type might be missing
    return audits.length > 0 ? audits[0] : null;
  },

  clearAudits: () => {
    localStorage.removeItem(STORAGE_KEYS.AUDITS);
  },

  // Admin / System Stats Simulation (Using Real Data)
  getSystemStats: () => {
    const realHistory = db.getAudits(); // Get ALL audits for admin stats
    const realUsers = db.getAllUsers();
    
    // Calculate simple activity data (audits per day - mocked distribution based on real count)
    const totalActivity = realHistory.length;
    
    return {
      totalUsers: realUsers.length,
      totalAudits: totalActivity,
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
      history: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDITS) || '[]'), // Renamed key in export for clarity, mapped to audits in localstorage
      exportedAt: new Date().toISOString()
    };
  },

  importData: (jsonData: any) => {
    if (jsonData.users && Array.isArray(jsonData.users)) {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(jsonData.users));
    }
    // Handle both 'audits' (legacy backup) and 'history' (new backup) keys
    if (jsonData.history && Array.isArray(jsonData.history)) {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(jsonData.history));
    } else if (jsonData.audits && Array.isArray(jsonData.audits)) {
      localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(jsonData.audits));
    }
  }
};