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
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold mr-3">
                W
              </span>
              <h1 className="text-lg font-semibold text-gray-900">
                Warehouse Inventory Management System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Placeholder */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome, {user?.name || 'User'}
          </h2>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mb-6">
            <p className="text-blue-900 font-semibold text-lg">
              Role: <span className="font-mono bg-blue-100 px-2 py-0.5 rounded text-blue-800">{user?.role}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 uppercase">User ID</span>
              <p className="text-lg font-bold text-gray-800">{user?.id}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 uppercase">Email</span>
              <p className="text-lg font-bold text-gray-800">{user?.email}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <span className="text-xs font-medium text-gray-500 uppercase">Authentication State</span>
              <p className="text-lg font-bold text-green-600">Active (JWT Verified)</p>
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-400 italic">
            Phase 1 placeholder. Core warehouse modules (inventory, stock movements, picking, orders) will be unlocked in subsequent phases.
          </p>
        </div>
      </main>
    </div>
  );
};
