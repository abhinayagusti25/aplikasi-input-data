import React from 'react';
import { User } from 'firebase/auth';
import {
  Moon,
  Sun,
  LogOut,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'interview' | 'history';
  onTabChange: (tab: 'interview' | 'history') => void;
  historyCount: number;
  isOnline: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  historyCount,
  isOnline,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-white/70 dark:bg-[#0c0919]/75 backdrop-blur-xl border-b border-purple-100/60 dark:border-white/5 transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Futuristic / Ethereal App Branding inspired by ChatSavvy */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0d121f] to-[#583e84] text-white flex items-center justify-center font-display font-bold text-xs tracking-wider shadow-sm shadow-purple-900/10">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
                <polyline points="7.5 19.79 7.5 14.6 3 12" />
                <polyline points="21 12 16.5 14.6 16.5 19.79" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white">
                  Interview App
                </span>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/40 text-[#583e84] dark:text-purple-300">
                  Japan Class
                </span>
              </div>
            </div>
          </div>

          {/* Minimalist Segmented Tabs styled like modern pill navigation */}
          <nav className="flex items-center p-1 bg-neutral-200/50 dark:bg-white/5 rounded-full border border-purple-100/60 dark:border-white/10 backdrop-blur-md">
            <button
              id="tab-btn-interview"
              type="button"
              onClick={() => onTabChange('interview')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'interview'
                  ? 'bg-white dark:bg-[#1a1433] text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              Kuesioner
            </button>

            <button
              id="tab-btn-history"
              type="button"
              onClick={() => onTabChange('history')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-[#1a1433] text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              <span>Riwayat</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/60 text-[#583e84] dark:text-purple-200">
                  {historyCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Minimalist Online / Offline indicator */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] text-neutral-500 dark:text-neutral-400"
              title={isOnline ? 'Terhubung online' : 'Mode offline (tersimpan lokal)'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/40' : 'bg-amber-500'
                }`}
              />
              <span className="hidden sm:inline text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Google Drive Status / Auth Button */}
            {user ? (
              <div className="flex items-center space-x-1.5">
                <div
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950/50 text-[#583e84] dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40"
                  title={`Google Drive: ${user.email}`}
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="max-w-[90px] truncate hidden md:inline">
                    {user.displayName?.split(' ')[0] || 'Drive'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Putuskan sambungan Google"
                  className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-signin"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 rounded-full border border-neutral-300/80 dark:border-white/10 hover:border-purple-300 bg-white/80 dark:bg-white/5 backdrop-blur-md text-neutral-800 dark:text-neutral-200 text-xs font-medium flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                title="Hubungkan ke Google Drive"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isLoggingIn ? '...' : 'Drive'}
                </span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              id="btn-toggle-darkmode"
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-full text-neutral-400 hover:text-[#583e84] dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={darkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
