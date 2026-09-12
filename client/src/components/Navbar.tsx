import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';
import {
  FlaskConical,
  Flame,
  Coins,
  Mail,
  User as UserIcon,
  Volume2,
  VolumeX,
  LogOut,
  Scroll,
  Gamepad2,
  LayoutDashboard
} from 'lucide-react';
import api from '../api/client';

interface NavbarProps {
  activeTab: 'dashboard' | 'game' | 'itinerary' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'game' | 'itinerary' | 'profile') => void;
  onOpenMailbox?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenMailbox }) => {
  const { user, logout } = useAuth();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [unclaimedMail, setUnclaimedMail] = useState(0);

  const toggleAudio = () => {
    sound.enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
    if (!audioEnabled) sound.playBlip();
  };

  useEffect(() => {
    if (!user) return;
    const checkMail = async () => {
      try {
        const res = await api.get('/game/mailbox');
        setUnclaimedMail(res.data.unclaimedCount || 0);
      } catch (e) {
        // silent
      }
    };
    checkMail();
    const interval = setInterval(checkMail, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const streak = user.streak || 0;
  const multiplier = Math.min(3.0, 1.0 + (streak * 0.1)).toFixed(1);
  const xp = user.gameData?.xp || 0;
  const level = user.gameData?.level || 1;
  const currentLevelXp = xp % 100;
  const gold = user.gameData?.gold || 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0f0f1b]/95 backdrop-blur-md border-b border-purple-900/40 shadow-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => { sound.playBlip(); setActiveTab('game'); }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 p-0.5 shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#16213e] rounded-[7px] flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <div>
              <h1 className="font-cinzel font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-300 to-teal-300 tracking-wider">
                ALCHEMIST'S HAVEN
              </h1>
              <span className="text-[10px] font-pixel text-purple-400 tracking-widest block -mt-1">
                POTION RPG
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 bg-[#16213e]/70 p-1 rounded-xl border border-purple-900/30 text-xs font-medium">
            <button
              onClick={() => { sound.playBlip(); setActiveTab('dashboard'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => { sound.playBlip(); setActiveTab('game'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'game'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md glow-gold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Brewery RPG</span>
            </button>

            <button
              onClick={() => { sound.playBlip(); setActiveTab('itinerary'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'itinerary'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Scroll className="w-3.5 h-3.5" />
              <span>Itinerary</span>
            </button>

            <button
              onClick={() => { sound.playBlip(); setActiveTab('profile'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Profile & Shop</span>
            </button>
          </nav>
        </div>

        {/* Stats & Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          
          {/* Gold Pill */}
          <div className="flex items-center gap-1.5 bg-[#16213e] px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{gold}</span>
          </div>

          {/* Level & XP Bar */}
          <div className="flex flex-col gap-0.5 min-w-[110px] bg-[#16213e] px-2.5 py-1 rounded-lg border border-purple-500/30">
            <div className="flex justify-between items-center text-[10px] text-purple-300 font-semibold">
              <span>Lv. {level}</span>
              <span className="text-slate-400">{currentLevelXp}/100 XP</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${currentLevelXp}%` }}
              />
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-950/80 to-amber-950/80 px-2.5 py-1 rounded-lg border border-orange-500/40 text-orange-400 text-xs font-bold">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>{streak}d</span>
            <span className="text-[10px] px-1 bg-orange-600/40 text-amber-300 rounded border border-orange-400/40">
              {multiplier}x
            </span>
          </div>

          {/* Mailbox Button with Notification */}
          <button
            onClick={() => {
              sound.playBlip();
              if (onOpenMailbox) onOpenMailbox();
              else setActiveTab('game');
            }}
            className="relative p-2 rounded-lg bg-[#16213e] hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700/50 transition-colors"
            title="Mailbox Deliveries"
          >
            <Mail className="w-4 h-4" />
            {unclaimedMail > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unclaimedMail}
              </span>
            )}
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className="p-2 rounded-lg bg-[#16213e] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
            title={audioEnabled ? 'Mute Retro Audio' : 'Enable Retro Audio'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Logout */}
          <button
            onClick={() => { sound.playBlip(); logout(); }}
            className="p-2 rounded-lg bg-[#16213e] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700/50 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
