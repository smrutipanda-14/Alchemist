import React, { useState, useEffect } from 'react';
import { Scroll, CheckCircle2, Clock } from 'lucide-react';
import api from '../api/client';

interface ItineraryItem {
  id: number;
  todoTaskHeading: string;
  timeOfCompletion: string;
  createdAt: string;
}

export const ItineraryPage: React.FC = () => {
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const res = await api.get('/tasks/itinerary');
        setItinerary(res.data.itinerary || []);
      } catch (e) {
        console.error('Failed to load itinerary', e);
      } finally {
        setLoading(false);
      }
    };
    fetchItinerary();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#16213e] p-6 rounded-2xl border border-teal-900/50 shadow-xl">
        <div className="p-3 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
          <Scroll className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-cinzel text-teal-200">The Grand Alchemical Itinerary</h2>
          <p className="text-xs text-slate-400">
            A permanent chronological chronicle of all completed todo quests and alchemical milestones.
          </p>
        </div>
      </div>

      {/* Itinerary Timeline */}
      <div className="bg-[#16213e]/80 backdrop-blur-md rounded-2xl border border-purple-900/40 p-6 shadow-xl">
        {loading ? (
          <p className="text-center py-12 text-slate-500 text-xs">Unfurling grimoire parchment...</p>
        ) : itinerary.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Scroll className="w-12 h-12 mx-auto text-slate-600 opacity-40" />
            <p className="text-sm text-slate-400">No completed todo entries recorded yet.</p>
            <p className="text-xs text-slate-500">Complete todo tasks on your dashboard to chronicle your achievements here!</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-teal-500/40 ml-4 space-y-6 my-2">
            {itinerary.map((item) => {
              const date = new Date(item.timeOfCompletion || item.createdAt);
              return (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline node */}
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-teal-500 border-2 border-[#0f0f1b] shadow glow-emerald group-hover:scale-125 transition-transform" />
                  
                  <div className="bg-[#0f0f1b]/90 border border-slate-800 rounded-xl p-4 shadow-md group-hover:border-teal-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span className="font-semibold text-sm text-slate-200">{item.todoTaskHeading}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                      <Clock className="w-3.5 h-3.5 text-teal-400" />
                      <span>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
