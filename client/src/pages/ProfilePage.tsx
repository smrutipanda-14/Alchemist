import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';
import {
  User as UserIcon,
  Flame,
  Award,
  Coins,
  Sparkles,
  ShoppingBag,
  Edit3,
  Check,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';

interface BannerCosmetic {
  id: number;
  name: string;
  imagePath: string;
  priceGold: number;
  description: string;
}

interface StickerCosmetic {
  id: number;
  name: string;
  imagePath: string;
  priceGold: number;
  category: string;
}

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile, updateGameStats } = useAuth();

  // Profile Edit states
  const [bio, setBio] = useState(user?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [pfpFile, setPfpFile] = useState<File | null>(null);

  // Shop states
  const [banners, setBanners] = useState<BannerCosmetic[]>([]);
  const [stickers, setStickers] = useState<StickerCosmetic[]>([]);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const res = await api.get('/game/shop');
        setBanners(res.data.banners || []);
        setStickers(res.data.stickers || []);
      } catch (e) {
        console.error('Failed to load shop', e);
      }
    };
    fetchShop();
  }, []);

  const handleUpdateBio = async () => {
    try {
      sound.playBlip();
      await api.put('/auth/profile', { bio });
      setIsEditingBio(false);
      await refreshProfile();
    } catch (e) {
      alert('Failed to update bio');
    }
  };

  const handleUploadPfp = async () => {
    if (!pfpFile) return;
    try {
      sound.playBlip();
      const formData = new FormData();
      formData.append('pfp', pfpFile);
      await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      sound.playFanfare();
      setPfpFile(null);
      await refreshProfile();
    } catch (e) {
      alert('Failed to upload avatar');
    }
  };

  const handleBuyBanner = async (banner: BannerCosmetic) => {
    const currentGold = user?.gameData?.gold || 0;
    if (currentGold < banner.priceGold) {
      alert(`Insufficient gold! You need ${banner.priceGold} Gold.`);
      return;
    }

    setBuyingId(banner.id);
    sound.playBlip();

    try {
      const res = await api.post('/game/shop/buy-banner', { bannerId: banner.id });
      sound.playCoin();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      setStatusMessage(res.data.message);
      updateGameStats({ gold: res.data.newGold });
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to purchase banner');
    } finally {
      setBuyingId(null);
    }
  };

  if (!user) return null;

  const streak = user.streak || 0;
  const multiplier = Math.min(3.0, 1.0 + (streak * 0.1)).toFixed(1);
  const xp = user.gameData?.xp || 0;
  const level = user.gameData?.level || 1;
  const gold = user.gameData?.gold || 0;
  const badges = user.badges || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* 1. HERO PROFILE CARD & BANNER */}
      <div className="relative rounded-2xl bg-[#16213e] border border-purple-900/50 overflow-hidden shadow-2xl">
        
        {/* Customizable Banner Header */}
        <div className="h-44 md:h-56 w-full bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center space-y-1">
            <span className="text-xs font-pixel text-amber-300 tracking-widest block">GRAND ALCHEMY GUILD</span>
            <h2 className="font-cinzel text-3xl font-bold text-white tracking-wider">{user.username}</h2>
            <span className="text-xs text-purple-200">Level {level} Grandmaster Brewmaster</span>
          </div>
        </div>

        {/* Profile Details Bar */}
        <div className="p-6 md:p-8 relative">
          
          {/* Avatar Icon */}
          <div className="absolute -top-14 left-8 w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 p-1 shadow-2xl">
            <div className="w-full h-full bg-[#0f0f1b] rounded-[12px] flex items-center justify-center overflow-hidden">
              {user.pfpPath && user.pfpPath.startsWith('/uploads') ? (
                <img src={user.pfpPath} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-amber-400" />
              )}
            </div>
          </div>

          <div className="pt-8 md:pt-0 md:pl-32 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-xl text-slate-100">{user.username}</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40 font-semibold">
                  Lv. {level}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-950/80 text-orange-400 border border-orange-500/40 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {streak}d ({multiplier}x XP)
                </span>
              </div>

              {/* Bio */}
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {isEditingBio ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-[#0f0f1b] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={handleUpdateBio}
                      className="p-1.5 bg-purple-600 rounded-lg text-white text-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="italic text-slate-400 flex items-center gap-2">
                    "{user.bio || 'Crafting the Elixir of Immortality'}"
                    <button
                      onClick={() => { sound.playBlip(); setIsEditingBio(true); }}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </p>
                )}
              </div>
            </div>

            {/* Change Avatar Upload */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-[#0f0f1b] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Change Avatar</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setPfpFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {pfpFile && (
                <button
                  onClick={handleUploadPfp}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Upload
                </button>
              )}
            </div>

          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-center">
            <div className="bg-[#0f0f1b] p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Total Experience</span>
              <span className="text-base font-bold text-purple-400 font-pixel mt-1 block">{xp} XP</span>
            </div>
            <div className="bg-[#0f0f1b] p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Alchemist Level</span>
              <span className="text-base font-bold text-teal-400 font-pixel mt-1 block">Lv. {level}</span>
            </div>
            <div className="bg-[#0f0f1b] p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Daily Streak</span>
              <span className="text-base font-bold text-orange-400 font-pixel mt-1 block">{streak} Days</span>
            </div>
            <div className="bg-[#0f0f1b] p-3 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block">Vault Gold</span>
              <span className="text-base font-bold text-amber-400 font-pixel mt-1 block">{gold} 🪙</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. BADGES & TROPHY CABINET */}
      <div className="bg-[#16213e] p-6 rounded-2xl border border-purple-900/50 space-y-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg font-cinzel text-slate-100">Alchemical Badges & Trophies</h3>
            <p className="text-xs text-slate-400">Earned through streaks, customer quests, focus mastery, and grand brewing concoctions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.length === 0 ? (
            <div className="col-span-full text-center py-8 text-slate-500 text-xs">
              No badges earned yet. Complete customer quests or brew potions to claim trophies!
            </div>
          ) : (
            badges.map(badge => (
              <div
                key={badge.id}
                className="p-3.5 rounded-xl bg-[#0f0f1b] border border-amber-500/30 flex items-center gap-3 shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-400/40 flex items-center justify-center text-xl flex-shrink-0">
                  🎖️
                </div>
                <div>
                  <h4 className="font-bold text-xs text-amber-300">{badge.name}</h4>
                  <p className="text-[11px] text-slate-400">{badge.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. GOLD EMPORIUM & COSMETICS SHOP */}
      <div className="bg-[#16213e] p-6 rounded-2xl border border-amber-900/50 space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-amber-900/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-cinzel text-amber-200">The Golden Emporium (Cosmetics Shop)</h3>
              <p className="text-xs text-slate-400">Spend gold earned from potion customers on prestige banners and mystical stickers.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-400 text-xs font-bold font-pixel">
            <Coins className="w-4 h-4" />
            <span>{gold} GOLD</span>
          </div>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-500/40 text-amber-200 text-xs font-semibold flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-amber-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Banners Shelf */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold font-pixel text-purple-300">CUSTOM PROFILE BANNERS</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {banners.map(b => (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-[#0f0f1b] border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-sm text-slate-100">{b.name}</h5>
                    <span className="text-xs font-bold text-amber-400 font-pixel">{b.priceGold} Gold</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{b.description}</p>
                </div>

                <button
                  onClick={() => handleBuyBanner(b)}
                  disabled={buyingId === b.id || gold < b.priceGold}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md glow-gold disabled:opacity-35 transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{gold < b.priceGold ? 'Need More Gold' : 'Purchase & Equip'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Stickers Shelf */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-bold font-pixel text-teal-300">MYSTICAL STICKERS & EMBLEMS</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stickers.map(s => (
              <div
                key={s.id}
                className="p-3 rounded-xl bg-[#0f0f1b] border border-slate-800 text-center space-y-2"
              >
                <div className="text-3xl py-1">✨</div>
                <h5 className="text-xs font-bold text-slate-200">{s.name}</h5>
                <span className="text-[11px] text-amber-400 font-semibold block">{s.priceGold} Gold</span>
                <button
                  onClick={() => { sound.playCoin(); alert(`Purchased ${s.name}!`); }}
                  disabled={gold < s.priceGold}
                  className="w-full py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-40"
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
