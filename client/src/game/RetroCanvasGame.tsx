import React, { useEffect, useRef, useState, useCallback } from 'react';
import { sound } from '../utils/audio';
import {
  FlaskConical,
  Mail,
  Users,
  Sprout,
  X,
  Sparkles,
  CheckCircle2,
  Play,
  Square,
  PackageCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// Game Station Types
type ModalStation = 'NONE' | 'MAILBOX' | 'BREWING' | 'GARDEN' | 'CUSTOMERS';

interface Recipe {
  id: number;
  name: string;
  rarity: string;
  ingredients: { itemId: number; qty: number; name: string }[];
  xpYield: number;
  description: string;
}

const RECIPES_DATA: Recipe[] = [
  {
    id: 12,
    name: "Lesser Health Tonic",
    rarity: "COMMON",
    ingredients: [
      { itemId: 1, qty: 1, name: "Moonlight Lavender" },
      { itemId: 9, qty: 1, name: "Pure Springwater" },
      { itemId: 8, qty: 1, name: "Crystal Vial" }
    ],
    xpYield: 30,
    description: "Restores vitality and dispels physical fatigue."
  },
  {
    id: 13,
    name: "Potion of Clarity",
    rarity: "UNCOMMON",
    ingredients: [
      { itemId: 2, qty: 1, name: "Solar Bloom" },
      { itemId: 3, qty: 1, name: "Dewdrop Moss" },
      { itemId: 8, qty: 1, name: "Crystal Vial" }
    ],
    xpYield: 50,
    description: "Heightens concentration and unlocks creative focus."
  },
  {
    id: 14,
    name: "Elixir of Swiftness",
    rarity: "UNCOMMON",
    ingredients: [
      { itemId: 4, qty: 1, name: "Whispering Fern" },
      { itemId: 10, qty: 1, name: "Mystic Catalyst" },
      { itemId: 8, qty: 1, name: "Crystal Vial" }
    ],
    xpYield: 75,
    description: "Allows lightning-fast task completion and energetic flow."
  },
  {
    id: 15,
    name: "Dragonfire Brew",
    rarity: "RARE",
    ingredients: [
      { itemId: 6, qty: 1, name: "Dragon's Ember Leaf" },
      { itemId: 11, qty: 1, name: "Phoenix Ash" },
      { itemId: 8, qty: 1, name: "Crystal Vial" }
    ],
    xpYield: 120,
    description: "Ignites formidable inner power and determination."
  },
  {
    id: 16,
    name: "Celestial Essence",
    rarity: "LEGENDARY",
    ingredients: [
      { itemId: 5, qty: 1, name: "Starfall Lotus" },
      { itemId: 7, qty: 1, name: "Void Shroom" },
      { itemId: 10, qty: 1, name: "Mystic Catalyst" },
      { itemId: 8, qty: 1, name: "Crystal Vial" }
    ],
    xpYield: 250,
    description: "The pinnacle of the brewing arts. Radiates stellar light."
  }
];

export const RetroCanvasGame: React.FC<{ initialModal?: ModalStation }> = ({ initialModal = 'NONE' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { refreshProfile } = useAuth();

  // Active Station Modal
  const [activeStation, setActiveStation] = useState<ModalStation>(initialModal);
  const [nearbyStation, setNearbyStation] = useState<ModalStation>('NONE');

  // Game Data states
  const [inventory, setInventory] = useState<{ itemId: number; quantity: number; item: { name: string; type: string; rarity: string; imagePath: string } }[]>([]);
  const [mailboxItems, setMailboxItems] = useState<{ id: number; message: string; isClaimed: boolean; item?: { name: string } }[]>([]);
  const [orders, setOrders] = useState<{ id: number; npcName: string; dialog: string; requestedPotionId: number; goldReward: number; rareHerbReward?: { name: string }; requestedPotion?: { name: string } }[]>([]);
  const [craftingLoading, setCraftingLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Focus Mode Garden States
  const [focusDuration, setFocusDuration] = useState<number>(25); // minutes
  const [focusTimeLeft, setFocusTimeLeft] = useState<number>(0);
  const [isFocusing, setIsFocusing] = useState<boolean>(false);
  const [focusCompleted, setFocusCompleted] = useState<boolean>(false);

  // Load Inventory & Data
  const loadGameData = useCallback(async () => {
    try {
      const [invRes, mailRes, ordRes] = await Promise.all([
        api.get('/game/inventory'),
        api.get('/game/mailbox'),
        api.get('/game/orders')
      ]);
      setInventory(invRes.data.inventory || []);
      setMailboxItems(mailRes.data.mail || []);
      setOrders(ordRes.data.orders || []);
    } catch (e) {
      console.error('Error loading game data', e);
    }
  }, []);

  useEffect(() => {
    loadGameData();
  }, [loadGameData, activeStation]);

  // Handle Focus Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isFocusing && focusTimeLeft > 0) {
      timer = setInterval(() => {
        setFocusTimeLeft(prev => {
          if (prev <= 1) {
            setIsFocusing(false);
            setFocusCompleted(true);
            sound.playFanfare();
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isFocusing, focusTimeLeft]);

  const startFocusTimer = (mins: number) => {
    setFocusDuration(mins);
    setFocusTimeLeft(mins * 60);
    setIsFocusing(true);
    setFocusCompleted(false);
    sound.playBlip();
  };

  const cancelFocusTimer = () => {
    setIsFocusing(false);
    setFocusTimeLeft(0);
    setFocusCompleted(false);
    sound.playBlip();
  };

  const harvestGarden = async () => {
    try {
      const res = await api.post('/game/garden/harvest', { durationMinutes: focusDuration });
      sound.playHarvest();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setStatusMessage(res.data.message);
      setFocusCompleted(false);
      await loadGameData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to harvest');
    }
  };

  // Claim Mailbox
  const handleClaimMailbox = async () => {
    setClaimLoading(true);
    try {
      const res = await api.post('/game/mailbox/claim');
      sound.playFanfare();
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
      setStatusMessage(res.data.message);
      await loadGameData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to claim mail');
    } finally {
      setClaimLoading(false);
    }
  };

  // Craft Potion
  const handleCraftPotion = async (potionId: number) => {
    setCraftingLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.post('/game/craft', { potionId });
      sound.playBrewPotion();
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setStatusMessage(res.data.message);
      await loadGameData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to craft potion');
    } finally {
      setCraftingLoading(false);
    }
  };

  // Fulfill Customer Order
  const handleFulfillOrder = async (orderId: number) => {
    try {
      const res = await api.post('/game/orders/fulfill', { orderId });
      sound.playCoin();
      confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
      setStatusMessage(res.data.message);
      await loadGameData();
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(err.response?.data?.error || 'Failed to fulfill order');
    }
  };

  // -------------------------------------------------------------
  // 2D CANVAS RETRO RPG ENGINE
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game World Configuration
    const TILE_SIZE = 32;
    const COLS = 24;
    const ROWS = 16;
    canvas.width = COLS * TILE_SIZE;  // 768px
    canvas.height = ROWS * TILE_SIZE; // 512px

    // Player state
    const player = {
      x: 10 * TILE_SIZE,
      y: 9 * TILE_SIZE,
      speed: 3,
      dir: 'DOWN' as 'DOWN' | 'UP' | 'LEFT' | 'RIGHT',
      frame: 0,
      animTimer: 0,
      isMoving: false
    };

    // Interactive Stations in the World
    const stations = [
      { id: 'MAILBOX' as ModalStation, x: 4 * TILE_SIZE, y: 7 * TILE_SIZE, label: '📬 Mailbox' },
      { id: 'BREWING' as ModalStation, x: 10 * TILE_SIZE, y: 4 * TILE_SIZE, label: '⚗️ Cauldron' },
      { id: 'CUSTOMERS' as ModalStation, x: 18 * TILE_SIZE, y: 5 * TILE_SIZE, label: '🛒 Counter' },
      { id: 'GARDEN' as ModalStation, x: 4 * TILE_SIZE, y: 12 * TILE_SIZE, label: '🌿 Herb Garden' }
    ];

    const keys: Record<string, boolean> = {};

    const onKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      // Proximity interaction on Space / E / Enter
      if ((e.key === ' ' || e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearbyStation !== 'NONE' && activeStation === 'NONE') {
        sound.playBlip();
        setActiveStation(nearbyStation);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let animationId: number;

    const render = () => {
      // 1. Process Input & Move Player
      let dx = 0;
      let dy = 0;

      if (activeStation === 'NONE') {
        if (keys['arrowup'] || keys['w']) { dy -= player.speed; player.dir = 'UP'; }
        if (keys['arrowdown'] || keys['s']) { dy += player.speed; player.dir = 'DOWN'; }
        if (keys['arrowleft'] || keys['a']) { dx -= player.speed; player.dir = 'LEFT'; }
        if (keys['arrowright'] || keys['d']) { dx += player.speed; player.dir = 'RIGHT'; }
      }

      player.isMoving = dx !== 0 || dy !== 0;

      // Update position with boundary checks
      player.x = Math.max(TILE_SIZE, Math.min(canvas.width - TILE_SIZE * 2, player.x + dx));
      player.y = Math.max(TILE_SIZE * 3, Math.min(canvas.height - TILE_SIZE * 2, player.y + dy));

      // Animation frame step
      if (player.isMoving) {
        player.animTimer += 1;
        if (player.animTimer > 8) {
          player.frame = (player.frame + 1) % 4;
          player.animTimer = 0;
        }
      } else {
        player.frame = 0;
      }

      // Check proximity to stations
      let currentNearby: ModalStation = 'NONE';
      for (const st of stations) {
        const dist = Math.hypot(player.x - st.x, player.y - st.y);
        if (dist < TILE_SIZE * 1.8) {
          currentNearby = st.id;
          break;
        }
      }
      setNearbyStation(currentNearby);

      // ---------------------------------------------------------
      // DRAW WORLD MAP (Pokemon Red / Retro Pixel Aesthetic)
      // ---------------------------------------------------------

      // A. Draw Brewery Floor & Garden Grass
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const px = c * TILE_SIZE;
          const py = r * TILE_SIZE;

          if (r < 2) {
            // Brewery stone back wall
            ctx.fillStyle = '#1e1b2e';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#2d2644';
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
          } else if (c < 9 && r > 10) {
            // Outdoor Sacred Herb Garden
            ctx.fillStyle = (c + r) % 2 === 0 ? '#1b4332' : '#2d6a4f';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

            // Garden soil plots (2x2)
            if (c >= 2 && c <= 6 && r >= 11 && r <= 14) {
              ctx.fillStyle = '#582f0e';
              ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

              // Sprout flowers in garden
              ctx.fillStyle = isFocusing ? '#70e000' : '#d8f3dc';
              ctx.beginPath();
              ctx.arc(px + 16, py + 16, 5, 0, Math.PI * 2);
              ctx.fill();

              // Glowing flower bud
              ctx.fillStyle = isFocusing ? '#ffd166' : '#9d4edd';
              ctx.beginPath();
              ctx.arc(px + 16, py + 16, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Cozy Wooden Plank Flooring for Brewery
            ctx.fillStyle = (c + r) % 2 === 0 ? '#43281c' : '#392217';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#2b1810';
            ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

            // Alchemist Center Rug (Red / Gold)
            if (c >= 8 && c <= 14 && r >= 6 && r <= 10) {
              ctx.fillStyle = '#780000';
              ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
              ctx.strokeStyle = '#c1121f';
              ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
            }
          }
        }
      }

      // B. Wall Trimmings & Decorative Shelves
      ctx.fillStyle = '#654321';
      ctx.fillRect(0, TILE_SIZE * 2 - 6, canvas.width, 8);

      // Bookshelves on back wall
      for (let s = 1; s <= 6; s++) {
        const sx = s * 60;
        ctx.fillStyle = '#582f0e';
        ctx.fillRect(sx, 10, 48, 44);
        ctx.fillStyle = '#3a86ff';
        ctx.fillRect(sx + 6, 16, 8, 14);
        ctx.fillStyle = '#e63946';
        ctx.fillRect(sx + 16, 16, 6, 14);
        ctx.fillStyle = '#06d6a0';
        ctx.fillRect(sx + 24, 16, 8, 14);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(sx + 34, 16, 6, 14);
      }

      // C. Draw Interactive Objects

      // 1. 📬 Mailbox
      const mb = stations[0];
      ctx.fillStyle = '#3a5a40';
      ctx.fillRect(mb.x + 8, mb.y + 12, 16, 20); // Post
      ctx.fillStyle = '#b7094c';
      ctx.fillRect(mb.x + 2, mb.y + 2, 28, 16); // Box
      ctx.fillStyle = '#f72585';
      ctx.fillRect(mb.x + 22, mb.y - 4, 4, 10); // Red Delivery Flag

      // 2. ⚗️ Cauldron / Brewing Table
      const br = stations[1];
      // Brewing Stone hearth
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(br.x - 8, br.y - 12, 48, 48);
      // Boiling Cauldron
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(br.x + 16, br.y + 12, 18, 0, Math.PI * 2);
      ctx.fill();
      // Glowing Potion Liquid
      const liquidColors = ['#9d4edd', '#00b4d8', '#38b000', '#ff006e'];
      const liquidCol = liquidColors[Math.floor(Date.now() / 400) % liquidColors.length];
      ctx.fillStyle = liquidCol;
      ctx.beginPath();
      ctx.arc(br.x + 16, br.y + 12, 13, 0, Math.PI * 2);
      ctx.fill();
      // Bubbles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(br.x + 13 + Math.sin(Date.now() / 150) * 4, br.y + 10, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. 🛒 Front Customer Counter
      const cs = stations[2];
      ctx.fillStyle = '#7f4f24';
      ctx.fillRect(cs.x - 16, cs.y, 80, 24);
      ctx.fillStyle = '#936639';
      ctx.fillRect(cs.x - 16, cs.y + 20, 80, 12);

      // NPC Customer behind counter
      ctx.fillStyle = '#4cc9f0';
      ctx.fillRect(cs.x + 16, cs.y - 20, 20, 20); // NPC head/body
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(cs.x + 18, cs.y - 26, 16, 8); // NPC hat

      // Speech bubble above customer
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cs.x + 8, cs.y - 48, 36, 18);
      ctx.fillStyle = '#0f0f1b';
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillText('🧪?', cs.x + 14, cs.y - 35);

      // D. Draw Player Sprite (Alchemist)
      const px = player.x;
      const py = player.y;

      // Drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 30, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Alchemist Robe (Purple & Gold trim)
      ctx.fillStyle = '#5a189a';
      ctx.fillRect(px + 8, py + 12, 16, 18);

      // Robe trim
      ctx.fillStyle = '#f6c90e';
      ctx.fillRect(px + 14, py + 14, 4, 16);

      // Face / Head
      ctx.fillStyle = '#fed9b7';
      ctx.fillRect(px + 10, py + 4, 12, 10);

      // Wizard Hat (Wide brim + Cone)
      ctx.fillStyle = '#3c096c';
      ctx.fillRect(px + 4, py + 2, 24, 4); // Brim
      ctx.fillRect(px + 8, py - 6, 16, 8);  // Mid
      ctx.fillRect(px + 12, py - 12, 8, 6); // Tip

      // Walking leg animation offset
      const legOffset = player.isMoving ? Math.sin(player.animTimer * 0.8) * 3 : 0;
      ctx.fillStyle = '#240046';
      ctx.fillRect(px + 8, py + 28 + legOffset, 6, 4);
      ctx.fillRect(px + 18, py + 28 - legOffset, 6, 4);

      // E. Proximity Interaction HUD Banner
      if (currentNearby !== 'NONE' && activeStation === 'NONE') {
        const found = stations.find(s => s.id === currentNearby);
        if (found) {
          ctx.fillStyle = 'rgba(15, 15, 27, 0.9)';
          ctx.strokeStyle = '#f6c90e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(px - 32, py - 40, 96, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f6c90e';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText('SPACE: OPEN', px - 24, py - 24);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeStation, nearbyStation, isFocusing]);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center select-none">
      
      {/* Station Quick-Action Bar */}
      <div className="w-full flex items-center justify-between bg-[#16213e] px-4 py-2 rounded-t-2xl border-t border-x border-purple-900/50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-[11px] text-amber-400">BREWERY REALM</span>
          <span className="text-xs text-slate-400 hidden sm:inline">Use WASD/Arrows to walk • Press SPACE or Click stations</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => { sound.playBlip(); setActiveStation('MAILBOX'); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-950/60 hover:bg-pink-900/80 border border-pink-500/40 text-pink-300 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mailbox</span>
          </button>
          <button
            onClick={() => { sound.playBlip(); setActiveStation('BREWING'); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Cauldron</span>
          </button>
          <button
            onClick={() => { sound.playBlip(); setActiveStation('CUSTOMERS'); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 text-blue-300 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>
          <button
            onClick={() => { sound.playBlip(); setActiveStation('GARDEN'); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900/80 border border-teal-500/40 text-teal-300 transition-colors"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Garden</span>
          </button>
        </div>
      </div>

      {/* Canvas Viewport Frame */}
      <div className="relative w-full aspect-[3/2] max-h-[560px] bg-[#0b0b14] border-2 border-purple-900/60 rounded-b-2xl overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain cursor-pointer image-rendering-pixelated"
          onClick={() => {
            if (nearbyStation !== 'NONE' && activeStation === 'NONE') {
              sound.playBlip();
              setActiveStation(nearbyStation);
            }
          }}
        />

        {/* Scanlines Overlay for Authentic Retro CRT feel */}
        <div className="absolute inset-0 scanlines opacity-40 pointer-events-none" />

        {/* Floating Proximity Prompt for Mobile / Mouse Click */}
        {nearbyStation !== 'NONE' && activeStation === 'NONE' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => { sound.playBlip(); setActiveStation(nearbyStation); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 font-bold font-pixel text-xs shadow-xl animate-bounce hover:scale-105 transition-transform"
            >
              <Sparkles className="w-4 h-4" />
              <span>INTERACT WITH {nearbyStation}</span>
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 1: 📬 MAILBOX DELIVERIES */}
        {/* ============================================================== */}
        {activeStation === 'MAILBOX' && (
          <div className="absolute inset-0 bg-[#0f0f1b]/95 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-pink-900/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cinzel text-pink-200">Guild Mailbox & Deliveries</h2>
                  <p className="text-xs text-slate-400">Claim materials and rewards dispatched from verified tasks and streaks.</p>
                </div>
              </div>
              <button
                onClick={() => { sound.playBlip(); setActiveStation('NONE'); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mail Items List */}
            <div className="my-4 flex-1 space-y-2.5 overflow-y-auto pr-2">
              {mailboxItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <PackageCheck className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Your mailbox is empty. Complete daily tasks or streak milestones to receive shipments!</p>
                </div>
              ) : (
                mailboxItems.map(mail => (
                  <div
                    key={mail.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                      mail.isClaimed
                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                        : 'bg-[#16213e] border-pink-500/30 shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{mail.isClaimed ? '📦' : '✨'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{mail.message}</p>
                        <span className="text-[11px] text-pink-400 font-semibold">
                          {mail.isClaimed ? 'Claimed' : 'Unclaimed Package'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Claim All Button */}
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400">
                {mailboxItems.filter(m => !m.isClaimed).length} Unclaimed Package(s)
              </span>
              <button
                onClick={handleClaimMailbox}
                disabled={claimLoading || mailboxItems.filter(m => !m.isClaimed).length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-sm shadow-lg glow-purple transition-all"
              >
                <PackageCheck className="w-4 h-4" />
                <span>{claimLoading ? 'Claiming...' : 'Claim All Deliveries'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 2: ⚗️ BREWING GRIMOIRE & CAULDRON */}
        {/* ============================================================== */}
        {activeStation === 'BREWING' && (
          <div className="absolute inset-0 bg-[#0f0f1b]/95 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cinzel text-purple-200">The Great Cauldron & Grimoire</h2>
                  <p className="text-xs text-slate-400">Combine raw herbs and catalysts to brew magical potions for XP and town orders.</p>
                </div>
              </div>
              <button
                onClick={() => { sound.playBlip(); setActiveStation('NONE'); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipes Grid */}
            <div className="my-4 flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-2">
              {RECIPES_DATA.map(recipe => {
                // Check if player has all ingredients
                const canCraft = recipe.ingredients.every(req => {
                  const itemInInv = inventory.find(i => i.itemId === req.itemId);
                  return (itemInInv?.quantity || 0) >= req.qty;
                });

                return (
                  <div
                    key={recipe.id}
                    className="p-3.5 rounded-xl bg-[#16213e]/90 border border-purple-800/40 flex flex-col justify-between gap-3 shadow-md hover:border-purple-500/50 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                          <span>🧪</span>
                          <span>{recipe.name}</span>
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-700/40 font-semibold">
                          +{recipe.xpYield} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{recipe.description}</p>

                      {/* Required Reagents */}
                      <div className="mt-2.5 space-y-1">
                        <span className="text-[11px] font-semibold text-purple-300">Required Reagents:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {recipe.ingredients.map(ing => {
                            const playerQty = inventory.find(i => i.itemId === ing.itemId)?.quantity || 0;
                            const hasEnough = playerQty >= ing.qty;

                            return (
                              <span
                                key={ing.itemId}
                                className={`text-[10px] px-2 py-1 rounded-md border flex items-center gap-1 font-medium ${
                                  hasEnough
                                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                                }`}
                              >
                                <span>{ing.name}</span>
                                <span>({playerQty}/{ing.qty})</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCraftPotion(recipe.id)}
                      disabled={craftingLoading || !canCraft}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-35 text-white font-bold text-xs shadow-md glow-purple transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{canCraft ? 'Brew Potion' : 'Missing Reagents'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {statusMessage && (
              <div className="p-2.5 mb-2 rounded-lg bg-purple-900/30 border border-purple-500/40 text-purple-200 text-xs text-center font-medium">
                {statusMessage}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 3: 🛒 TOWN CUSTOMER ORDERS */}
        {/* ============================================================== */}
        {activeStation === 'CUSTOMERS' && (
          <div className="absolute inset-0 bg-[#0f0f1b]/95 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-blue-900/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cinzel text-blue-200">Customer Counter & Quests</h2>
                  <p className="text-xs text-slate-400">Satisfy potion requests from traveling merchants and townsfolk to earn Gold, rare herbs, and badges.</p>
                </div>
              </div>
              <button
                onClick={() => { sound.playBlip(); setActiveStation('NONE'); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="my-4 flex-1 space-y-3 overflow-y-auto pr-2">
              {orders.map(order => {
                const potionInInv = inventory.find(i => i.itemId === order.requestedPotionId);
                const hasPotion = (potionInInv?.quantity || 0) >= 1;

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-[#16213e] border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-blue-300">{order.npcName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          +{order.goldReward} Gold
                        </span>
                        {order.rareHerbReward && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                            🌱 {order.rareHerbReward.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 italic">"{order.dialog}"</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Requested: <strong>{order.requestedPotion?.name || 'Magical Potion'}</strong></span>
                        <span className={`text-[11px] font-semibold ${hasPotion ? 'text-emerald-400' : 'text-red-400'}`}>
                          (You have: {potionInInv?.quantity || 0})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFulfillOrder(order.id)}
                      disabled={!hasPotion}
                      className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-35 text-slate-950 font-bold text-xs shadow-lg glow-gold transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{hasPotion ? 'Deliver Potion' : 'Potion Needed'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {statusMessage && (
              <div className="p-2.5 mb-2 rounded-lg bg-blue-900/30 border border-blue-500/40 text-blue-200 text-xs text-center font-medium">
                {statusMessage}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL 4: 🌿 SACRED GARDEN FOCUS MODE */}
        {/* ============================================================== */}
        {activeStation === 'GARDEN' && (
          <div className="absolute inset-0 bg-[#0f0f1b]/95 backdrop-blur-md z-30 p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center border-b border-teal-900/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-cinzel text-teal-200">The Sacred Herb Garden (Focus Sanctuary)</h2>
                  <p className="text-xs text-slate-400">Plant your focus. Longer uninterrupted focus periods produce abundant common herbs and rare lotus blooms.</p>
                </div>
              </div>
              <button
                onClick={() => { sound.playBlip(); setActiveStation('NONE'); }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timer Center Showcase */}
            <div className="my-6 flex flex-col items-center justify-center text-center space-y-4">
              
              {/* Pomodoro Circle Animation */}
              <div className="relative w-44 h-44 rounded-full border-4 border-teal-500/30 flex flex-col items-center justify-center bg-teal-950/20 shadow-2xl glow-emerald">
                <span className="text-4xl font-pixel font-bold text-teal-300 tracking-wider">
                  {isFocusing
                    ? `${Math.floor(focusTimeLeft / 60).toString().padStart(2, '0')}:${(focusTimeLeft % 60).toString().padStart(2, '0')}`
                    : `${focusDuration}:00`}
                </span>
                <span className="text-xs text-teal-400 font-semibold mt-1">
                  {isFocusing ? '🌱 Herbs Growing...' : focusCompleted ? '🌸 Ready to Harvest!' : 'Deep Focus Mode'}
                </span>
              </div>

              {/* Focus Duration Selection Buttons */}
              {!isFocusing && !focusCompleted && (
                <div className="flex items-center gap-2">
                  {[15, 25, 45, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setFocusDuration(mins)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        focusDuration === mins
                          ? 'bg-teal-600 text-white border-teal-400 shadow-md'
                          : 'bg-[#16213e] text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {mins} Mins
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isFocusing && !focusCompleted && (
                  <button
                    onClick={() => startFocusTimer(focusDuration)}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-xl glow-emerald transition-all"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Begin Focus Session</span>
                  </button>
                )}

                {isFocusing && (
                  <button
                    onClick={cancelFocusTimer}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Cancel Focus</span>
                  </button>
                )}

                {focusCompleted && (
                  <button
                    onClick={harvestGarden}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-sm shadow-xl glow-gold animate-bounce transition-all"
                  >
                    <Sprout className="w-5 h-5" />
                    <span>Harvest Botanical Herbs</span>
                  </button>
                )}
              </div>
            </div>

            {statusMessage && (
              <div className="p-2.5 mb-2 rounded-lg bg-teal-900/30 border border-teal-500/40 text-teal-200 text-xs text-center font-medium">
                {statusMessage}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
