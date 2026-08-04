import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { BattleNotificationModal } from './components/BattleNotificationModal';

import { LandingPage } from './components/LandingPage';
import { HomeDashboardView } from './components/views/HomeDashboardView';
import { PracticeView } from './components/views/PracticeView';
import { BattleView } from './components/views/BattleView';
import { CompetitionsView } from './components/views/CompetitionsView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { StatsView } from './components/views/StatsView';
import { ProfileView } from './components/views/ProfileView';
import { AdminPanelView } from './components/views/AdminPanelView';

const MainContent: React.FC = () => {
  const { activeTab, user } = useAuth();

  const renderActiveView = () => {
    // Before login: Show only the LandingPage
    if (!user) {
      return <LandingPage />;
    }

    // After login: Landing page is completely hidden and inaccessible
    const isAdmin = user.role === 'admin' || user.login === 'yy';

    switch (activeTab) {
      case 'home':
        return <HomeDashboardView />;
      case 'mashq':
        return <PracticeView />;
      case 'jang':
        return <BattleView />;
      case 'musobaqalar':
        return <CompetitionsView />;
      case 'statistika':
        return <StatsView />;
      case 'reyting':
        return <LeaderboardView />;
      case 'profil':
        return <ProfileView />;
      case 'admin':
        return isAdmin ? <AdminPanelView /> : <HomeDashboardView />;
      default:
        return <HomeDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 pb-16">
        {renderActiveView()}
      </main>

      <AuthModal />
      <BattleNotificationModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainContent />
      </WebSocketProvider>
    </AuthProvider>
  );
}
