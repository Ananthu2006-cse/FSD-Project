import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Navigation } from './Navigation';
import { fetchUsers, updateUserStatus, UserSummary } from './api';

interface PlaceholderModuleProps {
  moduleKey: string;
  title: string;
  stationCode: string;
  description: string;
  plannedFeatures: string[];
}

export const PlaceholderModule: React.FC<PlaceholderModuleProps> = ({
  moduleKey,
  title,
  stationCode,
  description,
  plannedFeatures,
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(moduleKey === 'users');
  const [userError, setUserError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  useEffect(() => {
    if (moduleKey === 'users') {
      loadUsers();
    }
  }, [moduleKey]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUserError('');
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: unknown) {
      setUserError('Failed to fetch user directory. Ensure ADMIN clearance is active.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleStatus = async (targetUser: UserSummary) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateUserStatus(targetUser.id, newStatus);
      setActionSuccess(`User ${targetUser.email} status changed to ${newStatus}.`);
      setTimeout(() => setActionSuccess(''), 4000);
      await loadUsers();
    } catch (err) {
      setUserError('Could not update user status.');
      setTimeout(() => setUserError(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4eedb] font-sans selection:bg-amber-300 selection:text-black">
      <Navigation />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1c1917]">
          
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b-2 border-dashed border-stone-300 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-stone-900 text-amber-300 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded uppercase">
                  {stationCode}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  OPERATIONAL CLEARANCE: {user?.role}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase mt-2">
                {title}
              </h1>
              <p className="font-mono text-xs text-stone-600 uppercase mt-1">
                {description}
              </p>
            </div>

            <div className="font-mono text-xs bg-amber-100 border-2 border-stone-900 rounded px-3 py-2 shadow-[2px_2px_0px_0px_#1c1917]">
              <span className="text-stone-500 uppercase block text-[10px]">Session Operator</span>
              <span className="font-black text-stone-900">{user?.name} ({user?.role})</span>
            </div>
          </div>

          {/* If module is 'users', render real User Management interface */}
          {moduleKey === 'users' ? (
            <div>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h2 className="text-lg font-black text-stone-900 uppercase">
                    Operator Directory &amp; Access Controls
                  </h2>
                  <p className="font-mono text-xs text-stone-600 uppercase">
                    Admin privileged user lifecycle administration
                  </p>
                </div>
                <button
                  onClick={loadUsers}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 border-2 border-stone-900 rounded text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                >
                  [ REFRESH DIRECTORY ]
                </button>
              </div>

              {actionSuccess && (
                <div className="mb-4 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 px-4 py-2 rounded font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#047857]">
                  ✓ {actionSuccess}
                </div>
              )}

              {userError && (
                <div className="mb-4 bg-red-100 border-2 border-red-700 text-red-900 px-4 py-2 rounded font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#b91c1c]">
                  ⚠ {userError}
                </div>
              )}

              {loadingUsers ? (
                <div className="py-12 text-center font-mono text-sm text-stone-600">
                  <div className="w-8 h-8 border-3 border-stone-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"></div>
                  QUERYING USER DIRECTORY...
                </div>
              ) : (
                <div className="border-2 border-stone-900 rounded overflow-x-auto shadow-[3px_3px_0px_0px_#1c1917]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-stone-900 text-amber-300 uppercase border-b-2 border-stone-900">
                      <tr>
                        <th className="py-3 px-4 font-black">ID</th>
                        <th className="py-3 px-4 font-black">Operator Name</th>
                        <th className="py-3 px-4 font-black">Email Identifier</th>
                        <th className="py-3 px-4 font-black">Clearance Role</th>
                        <th className="py-3 px-4 font-black">Status</th>
                        <th className="py-3 px-4 font-black">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 bg-[#fdfbf7]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-amber-50">
                          <td className="py-3 px-4 font-bold text-stone-700">#{u.id}</td>
                          <td className="py-3 px-4 font-black text-stone-900">{u.name}</td>
                          <td className="py-3 px-4 text-stone-800">{u.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase ${
                                u.role === 'ADMIN'
                                  ? 'bg-red-200 border-red-800 text-red-950'
                                  : u.role === 'MANAGER'
                                  ? 'bg-blue-200 border-blue-800 text-blue-950'
                                  : 'bg-emerald-200 border-emerald-800 text-emerald-950'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-600'
                                  : 'bg-red-100 text-red-800 border border-red-600'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'
                                }`}
                              ></span>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={u.id === user?.id}
                              className="px-2.5 py-1 bg-[#f4eedb] hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed border border-stone-800 rounded text-[10px] font-bold uppercase shadow-[1px_1px_0px_0px_#1c1917] transition-all"
                            >
                              {u.status === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Future Module Placeholder Interface */
            <div>
              <div className="bg-amber-100 border-2 border-stone-900 rounded p-4 mb-6 shadow-[3px_3px_0px_0px_#1c1917]">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-amber-800 text-base">ℹ</span>
                  <span className="font-mono text-xs font-bold text-stone-900 uppercase">
                    PHASE 2 RBAC VERIFICATION // MODULE ROUTE ACTIVE
                  </span>
                </div>
                <p className="mt-1 text-xs font-mono text-stone-700">
                  You are viewing the authorized interface for <strong className="uppercase">{title}</strong>. Full domain workflows and database entities for this module are slated for Phase 3.
                </p>
              </div>

              <h2 className="text-sm font-black font-mono text-stone-800 uppercase tracking-wider mb-3">
                [ SCHEDULED ARCHITECTURAL COMPONENTS ]
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plannedFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917]"
                  >
                    <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-widest block mb-1">
                      SPEC 0{idx + 1}
                    </span>
                    <h3 className="font-black text-sm text-stone-900 uppercase mb-2">
                      {feature}
                    </h3>
                    <div className="font-mono text-[11px] text-stone-600 bg-stone-100 p-2 rounded border border-stone-300">
                      Clearance: <strong className="text-stone-800">{user?.role}</strong> (Authorized)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module Footer Notice */}
          <div className="mt-8 pt-4 border-t-2 border-dashed border-stone-300 flex items-center justify-between text-stone-500 font-mono text-[11px] flex-wrap gap-2">
            <span>// ACCESS CONTROL: ROLE RBAC ENFORCED VIA JWT + ROUTE GUARD</span>
            <span>BUILD: 2026.09.05 // PHASE-2</span>
          </div>

        </div>
      </main>
    </div>
  );
};
