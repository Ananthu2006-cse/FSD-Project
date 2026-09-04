import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api, { LoginResponse } from './api';
import axios from 'axios';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors: { name?: string; email?: string; password?: string } = {};
    if (isRegistering && !name.trim()) {
      errors.name = 'OPERATOR NAME IS REQUIRED';
    }
    if (!email.trim()) {
      errors.email = 'EMAIL IS REQUIRED';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errors.email = 'ENTER A VALID EMAIL ADDRESS';
    }
    if (!password) {
      errors.password = 'PASSWORD IS REQUIRED';
    } else if (isRegistering && password.length < 6) {
      errors.password = 'MINIMUM 6 CHARACTERS REQUIRED';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        const response = await api.post<LoginResponse>('/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });

        login(response.data.token, response.data.user);
        navigate('/dashboard');
      } else {
        const response = await api.post<LoginResponse>('/auth/login', {
          email: email.trim(),
          password,
        });

        login(response.data.token, response.data.user);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorMessage(err.response.data?.message || 'Invalid email or password.');
        } else if (err.response?.status === 409) {
          setErrorMessage(err.response.data?.message || 'An account with this email already exists.');
        } else if (!err.response) {
          setErrorMessage('Network error: Backend server unreachable.');
        } else {
          setErrorMessage(err.response.data?.message || 'Server error. Please retry shortly.');
        }
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo@2024');
    setFieldErrors({});
    setErrorMessage('');
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFieldErrors({});
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4eedb] relative px-4 sm:px-6 lg:px-8 overflow-hidden font-sans selection:bg-amber-300 selection:text-black">
      {/* Retro Grid Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(to right, #78716c 1px, transparent 1px), linear-gradient(to bottom, #78716c 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Decorative Retro Stamp / Corner Accent */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 font-mono text-xs font-bold text-stone-600 tracking-widest uppercase flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-stone-800"></span>
        {isRegistering ? 'WMS-SYS // NEW-REGISTRATION' : 'WMS-SYS // TERMINAL-01'}
      </div>

      <div className="max-w-md w-full relative z-10 my-8">
        {/* Main Retro Card */}
        <div className="bg-[#fffdf7] border-4 border-stone-900 rounded-lg p-6 sm:p-8 shadow-[8px_8px_0px_0px_#1c1917] transition-all">
          
          {/* Header Section */}
          <div className="text-center pb-6 border-b-2 border-dashed border-stone-300">
            <div className="inline-flex items-center justify-center mb-3">
              <div className="w-14 h-14 bg-amber-400 border-3 border-stone-900 rounded-md flex items-center justify-center shadow-[3px_3px_0px_0px_#1c1917]">
                <svg
                  className="w-8 h-8 text-stone-950"
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
            </div>

            <div className="inline-block bg-stone-900 text-amber-300 font-mono text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded uppercase mb-2">
              {isRegistering ? 'CREATE NEW OPERATOR PROFILE' : 'EST. 1984 • LOGISTICS ENGINE'}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight uppercase">
              Warehouse Inventory Management System
            </h1>
            <p className="mt-1 text-xs font-mono text-stone-600 uppercase tracking-wide">
              {isRegistering ? 'Enrolling New Warehouse Personnel' : 'Operator Authorization Required'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-6 bg-red-100 border-2 border-red-700 text-red-900 px-4 py-2.5 rounded shadow-[3px_3px_0px_0px_#991b1b] flex items-center gap-2">
              <span className="font-mono font-bold text-lg leading-none">⚠</span>
              <span className="font-mono text-xs font-bold tracking-tight uppercase">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Form */}
          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {isRegistering && (
              <div>
                <label
                  htmlFor="name"
                  className="block font-mono text-xs font-bold text-stone-800 tracking-wider uppercase mb-1"
                >
                  [00] Operator Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="e.g. Alex Morgan"
                  className={`w-full font-mono text-sm px-3 py-2.5 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917] placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 transition-all ${
                    fieldErrors.name ? 'bg-red-50 border-red-600' : ''
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 font-mono text-[11px] font-bold text-red-600 tracking-tight">
                    &gt; {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block font-mono text-xs font-bold text-stone-800 tracking-wider uppercase mb-1"
              >
                [01] Operator Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="admin@example.com"
                className={`w-full font-mono text-sm px-3 py-2.5 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917] placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 transition-all ${
                  fieldErrors.email ? 'bg-red-50 border-red-600' : ''
                }`}
              />
              {fieldErrors.email && (
                <p className="mt-1 font-mono text-[11px] font-bold text-red-600 tracking-tight">
                  &gt; {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block font-mono text-xs font-bold text-stone-800 tracking-wider uppercase mb-1"
              >
                [02] Access Key / Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full font-mono text-sm px-3 py-2.5 bg-[#fdfbf7] border-2 border-stone-900 rounded shadow-[3px_3px_0px_0px_#1c1917] placeholder:text-stone-400 focus:outline-none focus:bg-white focus:border-amber-600 transition-all ${
                  fieldErrors.password ? 'bg-red-50 border-red-600' : ''
                }`}
              />
              {fieldErrors.password && (
                <p className="mt-1 font-mono text-[11px] font-bold text-red-600 tracking-tight">
                  &gt; {fieldErrors.password}
                </p>
              )}
            </div>

            {isRegistering && (
              <div>
                <label
                  htmlFor="role"
                  className="block font-mono text-xs font-bold text-stone-800 tracking-wider uppercase mb-1"
                >
                  [03] Assigned Role Clearance
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['STAFF', 'MANAGER', 'ADMIN'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-2 text-xs font-mono font-bold uppercase border-2 border-stone-900 rounded transition-all ${
                        role === r
                          ? 'bg-amber-400 text-stone-950 shadow-[2px_2px_0px_0px_#1c1917]'
                          : 'bg-[#f4eedb] text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-amber-400 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1c1917] text-stone-950 font-mono font-black text-sm tracking-widest uppercase border-3 border-stone-900 rounded shadow-[4px_4px_0px_0px_#1c1917] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-stone-900 border-t-transparent rounded-full animate-spin"></span>
                    <span>{isRegistering ? 'CREATING OPERATOR...' : 'AUTHENTICATING...'}</span>
                  </>
                ) : (
                  <span>{isRegistering ? '[ REGISTER & ENTER SYSTEM ]' : '[ LOGIN ACCESS ]'}</span>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Register / Login */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="font-mono text-xs font-bold text-stone-700 hover:text-stone-950 uppercase tracking-wider underline underline-offset-4 decoration-amber-500 hover:decoration-2 transition-all"
            >
              {isRegistering
                ? '← Already have clearance? Return to Login'
                : '+ Need access? Create new operator account'}
            </button>
          </div>

          {/* Quick Demo Section (shown in login mode) */}
          {!isRegistering && (
            <div className="mt-6 pt-4 border-t-2 border-dashed border-stone-300">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-stone-700 tracking-wider uppercase">
                  Demo Clearance Keys:
                </span>
                <span className="font-mono text-[10px] text-stone-500 uppercase">
                  PW: demo@2024
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@example.com')}
                  className="py-1.5 px-2 bg-[#f4eedb] hover:bg-amber-200 border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-mono text-xs font-bold text-stone-900 transition-all uppercase"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('manager@example.com')}
                  className="py-1.5 px-2 bg-[#f4eedb] hover:bg-amber-200 border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-mono text-xs font-bold text-stone-900 transition-all uppercase"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('staff@example.com')}
                  className="py-1.5 px-2 bg-[#f4eedb] hover:bg-amber-200 border-2 border-stone-900 rounded shadow-[2px_2px_0px_0px_#1c1917] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-mono text-xs font-bold text-stone-900 transition-all uppercase"
                >
                  Staff
                </button>
              </div>
            </div>
          )}

          {/* Footer Barcode / Badge */}
          <div className="mt-6 flex items-center justify-between text-stone-400 font-mono text-[10px] pt-3 border-t border-stone-200">
            <span>SECURE-AUTH-JWT</span>
            <span>||| | | |||| | |||</span>
            <span>V1.0.4</span>
          </div>

        </div>
      </div>
    </div>
  );
};
