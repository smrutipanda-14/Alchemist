import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/audio';
import {
  Sparkles,
  Flame,
  CheckCircle,
  Plus,
  UploadCloud,
  Check,
  Calendar,
  ListTodo,
  Layers,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../api/client';

interface DailyTemplate {
  id: number;
  title: string;
  description: string;
  xpReward: number;
  materialRewards: number[];
}

interface TaskItem {
  id: number;
  title: string;
  description?: string;
  type: 'DAILY' | 'TODO';
  xpReward: number;
  isCompleted: boolean;
  status: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED';
  proofUrl?: string;
  proofNote?: string;
  submittedAt?: string;
}

export const DashboardPage: React.FC<{ onNavigateToGame: () => void }> = ({ onNavigateToGame }) => {
  const { user, refreshProfile } = useAuth();

  // Task states
  const [dailyTasks, setDailyTasks] = useState<TaskItem[]>([]);
  const [todoTasks, setTodoTasks] = useState<TaskItem[]>([]);
  const [pool, setPool] = useState<DailyTemplate[]>([]);
  const [selectedPoolIds, setSelectedPoolIds] = useState<number[]>([]);
  const [showPoolPicker, setShowPoolPicker] = useState(false);

  // New Todo State
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDesc, setNewTodoDesc] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  // Proof Submission Modal
  const [submittingTask, setSubmittingTask] = useState<TaskItem | null>(null);
  const [proofNote, setProofNote] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Fetch Dashboard Tasks & Pool
  const fetchTasks = useCallback(async () => {
    try {
      const [dashRes, poolRes] = await Promise.all([
        api.get('/tasks/dashboard'),
        api.get('/tasks/pool')
      ]);
      setDailyTasks(dashRes.data.dailyTasks || []);
      setTodoTasks(dashRes.data.todoTasks || []);
      setPool(poolRes.data.pool || []);
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    // Poll for status updates every 4 seconds while queue processes
    const interval = setInterval(fetchTasks, 4000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Handle Setting Daily Tasks from Pool
  const handleSaveDailySelection = async () => {
    if (selectedPoolIds.length === 0) return;
    sound.playBlip();
    try {
      await api.post('/tasks/daily', { taskIds: selectedPoolIds });
      sound.playFanfare();
      setShowPoolPicker(false);
      await fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update daily tasks');
    }
  };

  // Handle Add Todo Task
  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    sound.playBlip();
    setAddingTodo(true);

    try {
      await api.post('/tasks/todo', {
        title: newTodoTitle.trim(),
        description: newTodoDesc.trim()
      });
      setNewTodoTitle('');
      setNewTodoDesc('');
      await fetchTasks();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create todo');
    } finally {
      setAddingTodo(false);
    }
  };

  // Handle Submit Proof
  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask) return;
    sound.playBlip();
    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append('taskId', submittingTask.id.toString());
      formData.append('proofNote', proofNote);
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await api.post('/tasks/proof', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      sound.playFanfare();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      setStatusMessage(res.data.message);
      setSubmittingTask(null);
      setProofNote('');
      setProofFile(null);
      await fetchTasks();
      await refreshProfile();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit proof');
    } finally {
      setUploadingProof(false);
    }
  };

  const streak = user?.streak || 0;
  const multiplier = Math.min(3.0, 1.0 + (streak * 0.1)).toFixed(1);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-16">
      
      {/* 1. STREAK & XP MULTIPLIER HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/90 via-[#16213e] to-amber-950/90 border border-purple-500/30 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold font-pixel">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>ACTIVE STREAK MULTIPLIER: {multiplier}X XP</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-cinzel text-slate-100">
              Welcome back, Alchemist {user?.username}
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Complete daily rituals to harvest brewing materials directly into your Brewery Mailbox. Your {streak}-day streak amplifies all earned XP by <strong>{multiplier}x</strong>!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { sound.playBlip(); onNavigateToGame(); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-xl glow-gold transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Open Brewery Realm</span>
            </button>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Status Message Banner */}
      {statusMessage && (
        <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-purple-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 2. MAIN TASK DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLUMNS: DAILY TASKS & TODAYS FOCUS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Tasks Header */}
          <div className="flex items-center justify-between bg-[#16213e] p-4 rounded-xl border border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-900/40 text-purple-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-cinzel text-slate-100">Today's Daily Rituals</h3>
                <p className="text-xs text-slate-400">Yields both XP and fresh brewing materials for your cauldron.</p>
              </div>
            </div>

            <button
              onClick={() => { sound.playBlip(); setShowPoolPicker(!showPoolPicker); }}
              className="px-3.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showPoolPicker ? 'Close Pool' : 'Select from Pool'}</span>
            </button>
          </div>

          {/* Daily Task Pool Selection Drawer */}
          {showPoolPicker && (
            <div className="bg-[#16213e]/95 border border-purple-500/40 rounded-xl p-5 space-y-4 shadow-xl animate-fadeIn">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-purple-300">Choose Rituals for Today's Pool</h4>
                <span className="text-xs text-slate-400">{selectedPoolIds.length} Selected</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {pool.map(item => {
                  const isSelected = selectedPoolIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        sound.playBlip();
                        setSelectedPoolIds(prev =>
                          prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-purple-900/40 border-purple-500 shadow-md'
                          : 'bg-[#0f0f1b]/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200">{item.title}</p>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                        <span className="text-[10px] text-amber-400 font-semibold mt-1 inline-block">
                          +{item.xpReward} XP + Materials 📦
                        </span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'border-slate-600'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleSaveDailySelection}
                disabled={selectedPoolIds.length === 0}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs rounded-xl shadow-lg glow-purple disabled:opacity-40"
              >
                Set Today's Daily Quota
              </button>
            </div>
          )}

          {/* Active Daily Tasks Cards */}
          <div className="space-y-3">
            {dailyTasks.length === 0 ? (
              <div className="text-center py-10 bg-[#16213e]/40 rounded-xl border border-dashed border-slate-800">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No daily rituals active today. Click "Select from Pool" to start!</p>
              </div>
            ) : (
              dailyTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    task.status === 'APPROVED'
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : task.status === 'PROCESSING'
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-[#16213e] border-slate-800 hover:border-purple-500/40 shadow-md'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{task.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 font-semibold border border-purple-700/40">
                        +{task.xpReward} XP
                      </span>
                      {task.status === 'PROCESSING' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 font-semibold animate-pulse">
                          Queue Processing...
                        </span>
                      )}
                      {task.status === 'APPROVED' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                  </div>

                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => { sound.playBlip(); setSubmittingTask(task); }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-md glow-purple flex items-center gap-1.5 flex-shrink-0"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Submit Proof</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: TODO TASKS & ITINERARY CREATION */}
        <div className="space-y-6">
          
          <div className="bg-[#16213e] p-5 rounded-2xl border border-teal-900/40 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-900/40 text-teal-300">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-cinzel text-slate-100">Todo Tasks</h3>
                <p className="text-xs text-slate-400">Fixed +45 XP rewards. Automatically tracked in your Itinerary.</p>
              </div>
            </div>

            {/* Create Todo Form */}
            <form onSubmit={handleCreateTodo} className="space-y-2.5 pt-2 border-t border-slate-800">
              <input
                type="text"
                required
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="Task title (e.g. Finish chemistry homework)..."
                className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <input
                type="text"
                value={newTodoDesc}
                onChange={(e) => setNewTodoDesc(e.target.value)}
                placeholder="Optional notes or details..."
                className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="submit"
                disabled={addingTodo || !newTodoTitle.trim()}
                className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 text-white font-bold text-xs rounded-xl shadow-md glow-emerald flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Todo (+45 XP)</span>
              </button>
            </form>

            {/* Todo Task List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {todoTasks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No pending todo items.</p>
              ) : (
                todoTasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                      task.status === 'APPROVED'
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : task.status === 'PROCESSING'
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-[#0f0f1b]/90 border-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{task.title}</p>
                      {task.description && <p className="text-[11px] text-slate-400">{task.description}</p>}
                    </div>

                    {task.status === 'PENDING' ? (
                      <button
                        onClick={() => { sound.playBlip(); setSubmittingTask(task); }}
                        className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold shadow flex-shrink-0"
                      >
                        Proof
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-400">
                        {task.status === 'PROCESSING' ? 'Processing...' : 'Done'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

      {/* 3. PROOF SUBMISSION MODAL */}
      {submittingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#16213e] border border-purple-900/60 rounded-2xl p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base font-cinzel text-slate-100">Submit Task Verification</h3>
              </div>
              <button
                onClick={() => setSubmittingTask(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#0f0f1b] border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">Task:</span>
              <p className="font-bold text-slate-200">{submittingTask.title}</p>
              <span className="text-amber-400 font-semibold block">
                Reward: +{submittingTask.xpReward} XP ({multiplier}x Multiplier Active)
              </span>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Completion Notes / Reflection</label>
                <textarea
                  rows={3}
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Describe what you completed, insights gained, or summary..."
                  className="w-full bg-[#0f0f1b] border border-slate-700/60 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Attach Image / Screenshot Proof (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-purple-600 file:text-white hover:file:bg-purple-500 bg-[#0f0f1b] p-2 rounded-xl border border-slate-800"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubmittingTask(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold text-xs shadow-lg glow-purple"
                >
                  {uploadingProof ? 'Dispatching to Queue...' : 'Submit to Guild Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
