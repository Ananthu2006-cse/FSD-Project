import React from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f4eedb] font-sans selection:bg-amber-300 selection:text-black">
      {/* Top Navigation */}
      <nav className="bg-[#fffdf7] border-b-4 border-stone-900 shadow-[0_4px_0px_0px_#1c1917]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18 items-center py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-400 border-2 border-stone-900 rounded flex items-center justify-center font-black text-stone-950 shadow-[2px_2px_0px_0px_#1c1917]">
                <svg
                  className="w-6 h-6 text-stone-950"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                  <path d="m3.3 7 8.7 5 8.7-5" />
                  <path d="M12 22V12" />
                </svg>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-stone-900 uppercase tracking-tight">
                  Warehouse Inventory Management System
                </h1>
                <span className="font-mono text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  TERMINAL ACTIVE // AUTHENTICATED
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:inline-block font-mono text-xs font-bold text-stone-700 bg-stone-100 border border-stone-800 px-2.5 py-1 rounded">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3.5 py-1.5 border-2 border-stone-900 text-xs font-mono font-bold uppercase rounded text-stone-900 bg-red-300 hover:bg-red-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#1c1917] transition-all"
              >
                [ LOGOUT ]
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Placeholder */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1c1917]">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b-2 border-dashed border-stone-300 mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase">
                Welcome, {user?.name || 'Operator'}
              </h2>
              <p className="font-mono text-xs text-stone-600 uppercase mt-0.5">
                Session Token Verified • Role Clearance Assigned
              </p>
            </div>
            <div className="bg-stone-900 text-amber-300 font-mono text-xs font-bold px-3 py-1 rounded border border-stone-800 uppercase shadow-[2px_2px_0px_0px_#1c1917]">
              WMS STATION #01
            </div>
          </div>

          <div className="bg-amber-100 border-3 border-stone-900 p-4 rounded shadow-[3px_3px_0px_0px_#1c1917] mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-stone-700 uppercase block">
                Security Clearance Role:
              </span>
              <span className="font-mono text-2xl font-black text-stone-950 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <span className="font-mono text-xs font-bold px-3 py-1 bg-amber-300 text-stone-900 border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] uppercase">
              Phase 1 Clearance Granted
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                [USER IDENTIFIER]
              </span>
              <p className="font-mono text-lg font-black text-stone-900 mt-1">ID #{user?.id}</p>
            </div>
            <div className="p-4 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                [AUTHENTICATED EMAIL]
              </span>
              <p className="font-mono text-sm font-bold text-stone-900 mt-1 truncate">{user?.email}</p>
            </div>
            <div className="p-4 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917]">
              <span className="font-mono text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                [SYSTEM STATUS]
              </span>
              <p className="font-mono text-sm font-black text-emerald-700 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                ACTIVE (JWT VERIFIED)
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-dashed border-stone-300 flex items-center justify-between text-stone-500 font-mono text-xs flex-wrap gap-2">
            <span>// SYSTEM NOTICE: WAREHOUSE CORE MODULES (INVENTORY, DISPATCH, PICKING) PENDING PHASE 2</span>
            <span>BUILD 2026.09.04</span>
          </div>
        </div>
      </main>
    </div>
  );
};
