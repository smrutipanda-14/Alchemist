import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { RetroCanvasGame } from './game/RetroCanvasGame';
import { ItineraryPage } from './pages/ItineraryPage';
import { ProfilePage } from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'game' | 'itinerary' | 'leaderboard' | 'profile'>('dashboard');
  const [openMailboxTrigger, setOpenMailboxTrigger] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b14] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 p-0.5 animate-spin">
          <div className="w-full h-full bg-[#16213e] rounded-[14px]" />
        </div>
        <span className="font-pixel text-xs text-purple-300 tracking-wider">
          UNFURLING ALCHEMY REALM...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[#0b0b14] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMailbox={() => {
          setActiveTab('game');
          setOpenMailboxTrigger(true);
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardPage onNavigateToGame={() => setActiveTab('game')} />
        )}

        {activeTab === 'game' && (
          <RetroCanvasGame initialModal={openMailboxTrigger ? 'MAILBOX' : 'NONE'} />
        )}

        {activeTab === 'itinerary' && (
          <ItineraryPage />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-600 border-t border-purple-950/30">
        Alchemist's Haven • Potion Brewing RPG Productivity • Powered by Node.js & React Canvas Engine
      </footer>
    </div>
  );
};
