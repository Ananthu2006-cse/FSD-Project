import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface NavItem {
  name: string;
  path: string;
  allowedRoles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Users', path: '/users', allowedRoles: ['ADMIN'] },
  { name: 'Products', path: '/products', allowedRoles: ['ADMIN', 'MANAGER'] },
  { name: 'Warehouses', path: '/warehouses', allowedRoles: ['ADMIN', 'MANAGER'] },
  { name: 'Inventory', path: '/inventory', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Movements', path: '/movements', allowedRoles: ['ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Orders & Dispatch', path: '/orders', allowedRoles: ['ADMIN', 'MANAGER'] },
  { name: 'Picking', path: '/picking', allowedRoles: ['STAFF'] },
  { name: 'Dispatch', path: '/dispatch', allowedRoles: ['STAFF'] },
  { name: 'Reports', path: '/reports', allowedRoles: ['ADMIN', 'MANAGER'] },
];

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role || 'STAFF';
  const allowedNavItems = NAV_ITEMS.filter((item) => item.allowedRoles.includes(userRole));

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500 text-white border-stone-900';
      case 'MANAGER':
        return 'bg-blue-500 text-white border-stone-900';
      case 'STAFF':
      default:
        return 'bg-emerald-500 text-stone-950 border-stone-900';
    }
  };

  return (
    <header className="bg-[#fffdf7] border-b-4 border-stone-900 shadow-[0_4px_0px_0px_#1c1917] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex justify-between h-16 items-center border-b-2 border-stone-200">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-amber-400 border-2 border-stone-900 rounded flex items-center justify-center font-black text-stone-950 shadow-[2px_2px_0px_0px_#1c1917] group-hover:bg-amber-300 transition-colors">
                <svg
                  className="w-5 h-5 text-stone-950"
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
                <span className="text-sm sm:text-base font-black text-stone-900 uppercase tracking-tight block leading-tight">
                  WAREHOUSE INV // RBAC
                </span>
                <span className="font-mono text-[9px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                  STATION CLEARANCE: {userRole}
                </span>
              </div>
            </Link>
          </div>

          {/* User profile and logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span
              className={`font-mono text-[11px] font-black uppercase px-2.5 py-0.5 border-2 rounded shadow-[1px_1px_0px_0px_#1c1917] ${getRoleBadgeStyle(
                userRole
              )}`}
            >
              {userRole}
            </span>
            <span className="hidden md:inline-block font-mono text-xs font-bold text-stone-700 bg-stone-100 border border-stone-800 px-2 py-0.5 rounded">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-2.5 py-1 border-2 border-stone-900 text-xs font-mono font-bold uppercase rounded text-stone-900 bg-red-300 hover:bg-red-400 active:translate-x-0.5 active:translate-y-0.5 shadow-[2px_2px_0px_0px_#1c1917] transition-all"
            >
              [ LOGOUT ]
            </button>
          </div>
        </div>

        {/* Role Filtered Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-2 py-2 overflow-x-auto no-scrollbar text-xs font-mono font-bold">
          {allowedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded border-2 uppercase whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 border-stone-900 shadow-[2px_2px_0px_0px_#1c1917]'
                    : 'border-transparent text-stone-700 hover:bg-stone-100 hover:border-stone-400'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
