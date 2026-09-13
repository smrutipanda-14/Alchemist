import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Globe,
  Calendar,
  Loader2
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';

export interface LeaderboardUser {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
  streak: number;
  pfpPath: string;
  bannerPath?: string;
}

export interface CurrentUserRank {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
  streak: number;
  pfpPath: string;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'all_time' | 'weekly'>('all_time');
  const [loading, setLoading] = useState<boolean>(true);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<CurrentUserRank | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async (selectedTimeframe: 'all_time' | 'weekly') => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/game/leaderboard?timeframe=${selectedTimeframe}`);
      setTopUsers(res.data.topUsers || []);
      setCurrentUserRank(res.data.currentUserRank || null);
    } catch (err: any) {
      console.error('Failed to load leaderboard', err);
      setError(err.response?.data?.error || 'Failed to fetch leaderboard rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(timeframe);
  }, [timeframe]);

  const handleTabChange = (newTimeframe: 'all_time' | 'weekly') => {
    if (newTimeframe === timeframe) return;
    sound.playBlip();
    setTimeframe(newTimeframe);
  };

  const top1 = topUsers.find(u => u.rank === 1);
  const top2 = topUsers.find(u => u.rank === 2);
  const top3 = topUsers.find(u => u.rank === 3);
  const restUsers = topUsers.filter(u => u.rank > 3);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 select-none">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#16213e] to-indigo-950/80 border border-purple-800/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>HALL OF GRAND ALCHEMISTS</span>
            </div>
            <h1 className="font-cinzel text-2xl md:text-3xl lg:text-4xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-purple-200 to-teal-300">
              REALM LEADERBOARD
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Honoring scholars, master potion brewers, and daily achievers who have harvested the highest alchemical experience.
            </p>
          </div>

          {/* Timeframe Selector Tabs */}
          <div className="flex items-center bg-[#0b0b14]/90 p-1.5 rounded-xl border border-purple-900/50 shadow-inner">
            <button
              onClick={() => handleTabChange('all_time')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                timeframe === 'all_time'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 shadow-lg glow-gold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Global All-Time</span>
            </button>

            <button
              onClick={() => handleTabChange('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                timeframe === 'weekly'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Weekly Sprint</span>
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <span className="font-pixel text-xs text-purple-300">SCRIBING LEADERBOARD RUNES...</span>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-950/40 border border-red-500/40 p-6 rounded-2xl text-center space-y-2">
          <p className="text-red-400 text-sm font-semibold">{error}</p>
          <button
            onClick={() => fetchLeaderboard(timeframe)}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* ============================================================== */}
          {/* TOP 3 PODIUM DISPLAY */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-4 items-end">
            
            {/* Rank 2 (Silver) */}
            <div className="order-2 md:order-1 flex flex-col items-center">
              {top2 ? (
                <div className={`w-full bg-[#16213e]/80 border-2 border-slate-400/50 hover:border-slate-300 rounded-2xl p-5 text-center flex flex-col items-center shadow-xl transition-transform hover:-translate-y-1 relative ${
                  user?.id === top2.userId ? 'ring-2 ring-purple-400' : ''
                }`}>
                  <div className="absolute -top-4 px-3 py-1 bg-slate-700 border border-slate-400 text-slate-200 font-pixel text-[10px] rounded-full shadow-md flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-slate-300" />
                    <span>2ND PLACE</span>
                  </div>

                  <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-slate-400 to-slate-200 shadow-lg mt-2 mb-3">
                    <img
                      src={top2.pfpPath}
                      alt={top2.username}
                      className="w-full h-full object-cover rounded-[14px] bg-[#0b0b14]"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatars/default_alchemist.png'; }}
                    />
                  </div>

                  <h3 className="font-bold text-slate-100 text-base truncate max-w-[180px]">{top2.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                      Lv. {top2.level}
                    </span>
                    <span className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5" />
                      {top2.streak}d
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 w-full">
                    <span className="text-[10px] text-slate-400 block">TOTAL EXPERIENCE</span>
                    <span className="font-pixel text-sm text-slate-200 font-bold block mt-0.5">
                      {top2.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 bg-[#16213e]/30 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                  Awaiting Contender
                </div>
              )}
            </div>

            {/* Rank 1 (Gold - Champion) */}
            <div className="order-1 md:order-2 flex flex-col items-center">
              {top1 ? (
                <div className={`w-full bg-gradient-to-b from-amber-950/40 via-[#1a1b35] to-[#16213e] border-2 border-amber-400/80 hover:border-amber-300 rounded-2xl p-6 text-center flex flex-col items-center shadow-2xl transition-transform hover:-translate-y-2 relative glow-gold ${
                  user?.id === top1.userId ? 'ring-4 ring-amber-400/50' : ''
                }`}>
                  <div className="absolute -top-5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-pixel text-xs font-black rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>👑 1ST CHAMPION</span>
                  </div>

                  <div className="w-24 h-24 rounded-2xl p-1.5 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-2xl mt-3 mb-3">
                    <img
                      src={top1.pfpPath}
                      alt={top1.username}
                      className="w-full h-full object-cover rounded-[12px] bg-[#0b0b14]"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatars/default_alchemist.png'; }}
                    />
                  </div>

                  <h3 className="font-bold text-amber-200 text-lg truncate max-w-[200px]">{top1.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold">
                      Lv. {top1.level}
                    </span>
                    <span className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                      <Flame className="w-4 h-4" />
                      {top1.streak}d streak
                    </span>
                  </div>

                  <div className="mt-5 pt-3 border-t border-amber-500/30 w-full bg-amber-950/30 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <span className="text-[10px] font-bold text-amber-400/80 block uppercase tracking-wider">CHAMPION XP</span>
                    <span className="font-pixel text-base text-amber-300 font-black block mt-0.5 glow-gold">
                      {top1.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-56 bg-[#16213e]/30 border border-dashed border-amber-500/40 rounded-2xl flex items-center justify-center text-xs text-amber-500/60">
                  Awaiting Grand Champion
                </div>
              )}
            </div>

            {/* Rank 3 (Bronze) */}
            <div className="order-3 md:order-3 flex flex-col items-center">
              {top3 ? (
                <div className={`w-full bg-[#16213e]/80 border-2 border-orange-700/60 hover:border-orange-500 rounded-2xl p-5 text-center flex flex-col items-center shadow-xl transition-transform hover:-translate-y-1 relative ${
                  user?.id === top3.userId ? 'ring-2 ring-purple-400' : ''
                }`}>
                  <div className="absolute -top-4 px-3 py-1 bg-amber-950 border border-orange-600 text-orange-300 font-pixel text-[10px] rounded-full shadow-md flex items-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-orange-400" />
                    <span>3RD PLACE</span>
                  </div>

                  <div className="w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr from-orange-700 to-amber-600 shadow-lg mt-2 mb-3">
                    <img
                      src={top3.pfpPath}
                      alt={top3.username}
                      className="w-full h-full object-cover rounded-[14px] bg-[#0b0b14]"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatars/default_alchemist.png'; }}
                    />
                  </div>

                  <h3 className="font-bold text-slate-100 text-base truncate max-w-[180px]">{top3.username}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                      Lv. {top3.level}
                    </span>
                    <span className="flex items-center gap-1 text-orange-400 text-xs font-semibold">
                      <Flame className="w-3.5 h-3.5" />
                      {top3.streak}d
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 w-full">
                    <span className="text-[10px] text-slate-400 block">TOTAL EXPERIENCE</span>
                    <span className="font-pixel text-sm text-orange-300 font-bold block mt-0.5">
                      {top3.xp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-48 bg-[#16213e]/30 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-xs text-slate-500">
                  Awaiting Contender
                </div>
              )}
            </div>

          </div>

          {/* ============================================================== */}
          {/* RANKS 4 - 50 LIST */}
          {/* ============================================================== */}
          <div className="bg-[#16213e]/70 border border-purple-900/40 rounded-2xl p-4 md:p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="flex items-center gap-4">
                <span className="w-8 text-center">Rank</span>
                <span>Alchemist</span>
              </div>
              <div className="flex items-center gap-6 md:gap-12">
                <span className="hidden sm:inline">Level</span>
                <span className="hidden sm:inline">Streak</span>
                <span className="w-24 text-right">Experience</span>
              </div>
            </div>

            {restUsers.length === 0 && topUsers.length <= 3 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No additional ranked scholars currently recorded.
              </div>
            )}

            <div className="space-y-2">
              {restUsers.map((u) => {
                const isCurrentUser = user?.id === u.userId;
                return (
                  <div
                    key={u.userId}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isCurrentUser
                        ? 'bg-purple-950/60 border border-purple-500/60 shadow-lg'
                        : 'bg-[#0f0f1b]/70 hover:bg-[#1f2b4e]/60 border border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <span className="w-8 text-center font-pixel text-xs text-slate-400 font-bold">
                        #{u.rank}
                      </span>

                      <div className="w-10 h-10 rounded-xl p-0.5 bg-gradient-to-tr from-purple-700 to-slate-700 shrink-0">
                        <img
                          src={u.pfpPath}
                          alt={u.username}
                          className="w-full h-full object-cover rounded-[10px] bg-[#0b0b14]"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatars/default_alchemist.png'; }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-200 truncate">
                            {u.username}
                          </span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 bg-purple-600 text-white rounded text-[9px] font-pixel">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block sm:hidden">
                          Lv. {u.level} • {u.streak}d streak
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 md:gap-12 shrink-0">
                      <span className="hidden sm:inline px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold">
                        Lv. {u.level}
                      </span>

                      <span className="hidden sm:flex items-center gap-1 text-orange-400 text-xs font-semibold">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        {u.streak}d
                      </span>

                      <div className="w-24 text-right">
                        <span className="font-pixel text-xs text-amber-400 font-bold">
                          {u.xp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* STICKY CURRENT PLAYER RANKING BANNER */}
      {/* ============================================================== */}
      {currentUserRank && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-4xl z-30">
          <div className="bg-gradient-to-r from-purple-900/95 via-[#16213e]/95 to-indigo-900/95 backdrop-blur-md border-2 border-amber-400/60 rounded-2xl p-3.5 px-5 shadow-2xl flex items-center justify-between gap-4 glow-gold">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl p-0.5 bg-gradient-to-tr from-amber-400 to-purple-500 shadow-md">
                <img
                  src={currentUserRank.pfpPath}
                  alt={currentUserRank.username}
                  className="w-full h-full object-cover rounded-[10px] bg-[#0b0b14]"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/avatars/default_alchemist.png'; }}
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs text-amber-300 font-bold">
                    YOUR RANK #{currentUserRank.rank}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">
                    ({currentUserRank.username})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                  <span className="text-purple-300 font-semibold">Lv. {currentUserRank.level}</span>
                  <span>•</span>
                  <span className="text-orange-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" />
                    {currentUserRank.streak} Days
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Current {timeframe === 'weekly' ? 'Weekly' : 'Total'} XP</span>
              <span className="font-pixel text-sm md:text-base text-amber-300 font-black">
                {currentUserRank.xp.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
