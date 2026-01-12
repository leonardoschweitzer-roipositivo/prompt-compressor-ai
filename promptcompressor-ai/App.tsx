import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { MainLayout } from './components/templates/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { History } from './pages/History';
import { Auth } from './pages/Auth';
import { ViewState } from './types';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [initialPrompt, setInitialPrompt] = useState<string>('');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (view: ViewState, data?: any) => {
    if (view === 'studio' && data?.prompt) {
      setInitialPrompt(data.prompt);
    }
    setCurrentView(view);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderContent = () => {
    if (loading) return <div className="h-screen flex items-center justify-center bg-[#0f172a] text-slate-500">Loading...</div>;

    if (!session) {
      return <Auth />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'studio':
        return <Studio initialPrompt={initialPrompt} />;
      case 'history':
        return <History />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (!session && !loading) {
    return <Auth />;
  }

  return (
    <MainLayout currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} userEmail={session?.user?.email}>
      {renderContent()}
    </MainLayout>
  );
};

export default App;