import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Users, Activity, Server, Trash2, Shield, Search, User as UserIcon, AlertOctagon, Download, Upload, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityData, setActivityData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setStats(db.getSystemStats());
    
    // Calculate real audit activity for the last 7 days
    const audits = db.getAudits();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
    });

    const data = last7Days.map(date => {
        const dateStr = date.toLocaleDateString();
        // Count audits that match this specific date string (local time)
        const count = audits.filter(a => new Date(a.timestamp).toLocaleDateString() === dateStr).length;
        
        return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }), // "Mon", "Tue"
            fullDate: dateStr,
            audits: count
        };
    });
    setActivityData(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteUser = (userId: string, email: string) => {
    if (email === currentUser?.email) {
      showNotification("You cannot delete your own admin account.", "error");
      return;
    }
    
    // We use a simple confirm here. 
    if (window.confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
      try {
        // Pass both userId and email to ensure deletion works even if IDs are missing in legacy data
        db.deleteUser(userId, email);
        showNotification(`User ${email} deleted successfully.`, "success");
        loadData(); // Refresh list immediately
      } catch (error) {
        console.error("Delete failed", error);
        showNotification("Failed to delete user.", "error");
      }
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm("DANGER: This will delete ALL users, audits, and account data. This action CANNOT be undone. Are you sure?")) {
      if (window.confirm("Please confirm a second time. This will wipe the entire database and log you out.")) {
         db.resetDatabase();
         window.location.reload();
      }
    }
  };

  const handleBackup = () => {
    try {
      const data = db.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo_auditor_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification("Backup file downloaded successfully", "success");
    } catch (e) {
      console.error(e);
      showNotification("Failed to generate backup", "error");
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        
        if (window.confirm("This will overwrite existing data with the backup file. Current session will be preserved if possible. Continue?")) {
           db.importData(data);
           showNotification("Data restored successfully!", "success");
           loadData(); // Refresh UI
        }
      } catch (err) {
        console.error(err);
        showNotification("Invalid backup file. Restoration failed.", "error");
      } finally {
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  if (!stats) return <div>Loading admin data...</div>;

  const filteredUsers = stats.users.filter((u: any) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-indigo-600" />
            Admin Console
          </h1>
          <p className="text-slate-500 mt-1">Real-time system overview and user management</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
            Operational
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Registered Users</h3>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
          <div className="mt-2 text-sm text-slate-500">Total accounts in database</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Total Audits</h3>
            <Activity className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalAudits}</div>
          <div className="mt-2 text-sm text-slate-500">Reports generated</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Active Session</h3>
            <Server className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">Active</div>
          <div className="mt-2 text-sm text-green-600 font-medium">You are logged in</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Management Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">User Management</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredUsers.length === 0 ? (
                   <tr>
                     <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                       No users found matching your search.
                     </td>
                   </tr>
                ) : (
                  filteredUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {u.avatar ? (
                              <img className="h-8 w-8 rounded-full" src={u.avatar} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-slate-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{u.name}</div>
                            <div className="text-sm text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isAdmin ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className={`text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors ${u.email === currentUser?.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={u.email === currentUser?.email}
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Chart & System Controls */}
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Audit Activity (7 Days)</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b' }}
                  />
                  <Line type="monotone" dataKey="audits" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-bold text-indigo-900">Data Management</h3>
            </div>
            <p className="text-sm text-indigo-700 mb-4">
              Backup your database to a file or restore from a previous backup to prevent data loss.
            </p>
            <div className="flex gap-3">
               <button
                  onClick={handleBackup}
                  className="flex-1 px-3 py-2 bg-white border border-indigo-200 text-indigo-600 font-medium rounded-lg hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center shadow-sm text-sm"
               >
                 <Download className="w-4 h-4 mr-2" />
                 Backup
               </button>
               <button
                  onClick={handleRestoreClick}
                  className="flex-1 px-3 py-2 bg-white border border-indigo-200 text-indigo-600 font-medium rounded-lg hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center shadow-sm text-sm"
               >
                 <Upload className="w-4 h-4 mr-2" />
                 Restore
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 className="hidden" 
                 accept=".json"
               />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm flex flex-col">
            <div className="flex items-center mb-4">
              <AlertOctagon className="w-5 h-5 text-red-600 mr-2" />
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Resetting the database will permanently delete all user accounts, audit history, and configuration.
            </p>
            <button
              onClick={handleResetDatabase}
              className="w-full px-4 py-2 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};