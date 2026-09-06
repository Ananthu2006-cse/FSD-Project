import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface AccessDeniedProps {
  requiredRoles?: string[];
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ requiredRoles }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="selection:bg-amber-300 selection:text-black">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 sm:p-10 shadow-[8px_8px_0px_0px_#1c1917] text-center">
          
          {/* Warning Icon Badge */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-400 border-3 border-stone-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_#1c1917]">
            <svg
              className="w-9 h-9 text-stone-950"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="inline-block bg-stone-900 text-red-400 font-mono text-xs font-black tracking-widest px-3 py-1 rounded uppercase mb-3">
            CLEARANCE PROTOCOL VIOLATION // HTTP 403
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 uppercase tracking-tight">
            Access Denied: Restricted Module
          </h1>

          <p className="mt-3 text-sm font-mono text-stone-600 max-w-md mx-auto">
            Your authenticated clearance role does not have authorization to view or execute operations within this sector.
          </p>

          {/* Diagnostic Info Box */}
          <div className="my-6 bg-red-50 border-2 border-red-800 rounded p-4 max-w-md mx-auto text-left shadow-[2px_2px_0px_0px_#991b1b]">
            <div className="font-mono text-xs space-y-1.5">
              <div className="flex justify-between border-b border-red-200 pb-1">
                <span className="text-stone-500 uppercase">Operator ID:</span>
                <span className="font-bold text-stone-900">#{user?.id || 'ANONYMOUS'}</span>
              </div>
              <div className="flex justify-between border-b border-red-200 pb-1">
                <span className="text-stone-500 uppercase">Current Clearance:</span>
                <span className="font-black text-red-700 uppercase tracking-wider">{user?.role || 'NONE'}</span>
              </div>
              {requiredRoles && requiredRoles.length > 0 && (
                <div className="flex justify-between pt-0.5">
                  <span className="text-stone-500 uppercase">Required Clearance:</span>
                  <span className="font-bold text-stone-800 uppercase">{requiredRoles.join(' or ')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-6 py-3 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 text-stone-950 font-mono font-black text-xs sm:text-sm tracking-wider uppercase border-3 border-stone-900 rounded shadow-[4px_4px_0px_0px_#1c1917] transition-all"
            >
              ← [ RETURN TO DASHBOARD ]
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
