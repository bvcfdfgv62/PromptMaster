import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { User } from './types';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Command } from 'lucide-react';
import { isCloudActive } from './services/supabase';
import { ToastProvider } from './components/UI';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize DB (Enterprise Remote or Local Fallback)
        await db.init();

        // Check for persisted session
        const storedUser = localStorage.getItem('pm_session');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          // Always verify with fresh remote data in Big Tech mode
          const freshData = await db.getUserByEmail(parsed.email);

          if (freshData) {
            setCurrentUser(freshData);
            setCurrentView('DASHBOARD');
          } else {
            localStorage.removeItem('pm_session');
          }
        }
      } catch (e) {
        console.error("Critical System Boot Failure:", e);
        localStorage.removeItem('pm_session');
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('pm_session', JSON.stringify(user));
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pm_session');
    setCurrentView('LOGIN');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('pm_session', JSON.stringify(updatedUser));
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 font-sans">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Command className="text-primary animate-pulse" size={32} />
          </div>
        </div>
        <div className="mt-12 text-center">
          <h2 className="text-white font-bold text-2xl tracking-tight mb-3">Inicializando_Sistema...</h2>
          <div className="flex items-center gap-3 text-secondary font-mono text-[10px] uppercase tracking-[0.4em] justify-center">
            <div className="w-1 h-1 bg-primary rounded-full animate-ping"></div>
            {isCloudActive ? 'SAAS_REMOTE_NODE: CONNECTED' : 'LOCAL_STORAGE_NODE: READY'}
          </div>
        </div>
      </div>
    );
  }

  // View Routing Logic
  if (!currentUser) {
    if (currentView === 'REGISTER') {
      return (
        <Register
          onLogin={handleLogin}
          onNavigateLogin={() => setCurrentView('LOGIN')}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onNavigateRegister={() => setCurrentView('REGISTER')}
      />
    );
  }

  // Authenticated Routing
  if (currentUser.role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return (
    <UserDashboard
      currentUser={currentUser}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;