import React, { useState } from 'react';
import { MainLayout } from './components/templates/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Studio } from './pages/Studio';
import { History } from './pages/History';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'studio':
        return <Studio />;
      case 'history':
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <MainLayout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </MainLayout>
  );
};

export default App;