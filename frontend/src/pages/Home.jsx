import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, FileText, Layout, Zap, CheckCircle, 
  ArrowRight, ShieldAlert, Sparkles, ChevronRight, Activity
} from 'lucide-react';
import { apiService } from '../api/apiService';

export default function Home() {
  const [stats, setStats] = useState({
    dumpsCount: 0,
    activeCount: 0,
    resolvedCount: 0,
    flaggedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [dumps, setDumps] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsData, dumpsData] = await Promise.all([
          apiService.getItems(),
          apiService.getDumps()
        ]);
        
        setItems(itemsData);
        setDumps(dumpsData);

        const active = itemsData.filter(i => !i.is_resolved).length;
        const resolved = itemsData.filter(i => i.is_resolved).length;
        const flagged = itemsData.filter(i => i.is_safety_flagged === 1).length;

        setStats({
          dumpsCount: dumpsData.length,
          activeCount: active,
          resolvedCount: resolved,
          flaggedCount: flagged
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Category counts
  const categoryCounts = {
    decide_now: items.filter(i => i.category === 'decide_now' && !i.is_resolved).length,
    needs_info: items.filter(i => i.category === 'needs_info' && !i.is_resolved).length,
    task: items.filter(i => i.category === 'task' && !i.is_resolved).length,
    let_go: items.filter(i => i.category === 'let_go' && !i.is_resolved).length,
  };

  const totalUnresolved = categoryCounts.decide_now + categoryCounts.needs_info + categoryCounts.task + categoryCounts.let_go;
  const loadPercentage = Math.min(Math.round((totalUnresolved / 15) * 100), 100);

  // Highest priority item
  const topFocus = items
    .filter(i => i.category === 'decide_now' && !i.is_resolved)
    .sort((a, b) => b.priority_score - a.priority_score)[0];

  const getLoadStatus = (p) => {
    if (p > 75) return { text: 'HIGH OVERLOAD', color: 'text-rose-400', progress: 'bg-rose-500' };
    if (p > 40) return { text: 'MODERATE LOAD', color: 'text-amber-400', progress: 'bg-amber-500' };
    return { text: 'LOW LOAD', color: 'text-emerald-400', progress: 'bg-emerald-500' };
  };

  const loadStatus = getLoadStatus(loadPercentage);

  return (
    <div className="max-w-6xl mx-auto py-10 px-8 space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 glass-panel rounded-3xl p-8 border-indigo-500/10 shadow-[0_0_30px_rgba(99,102,241,0.05)] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-[30%] bg-gradient-to-l from-indigo-600/10 to-transparent pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
            <span>AI-Powered Clarity</span>
          </div>
          <h1 className="font-outfit text-3xl font-bold text-white tracking-tight">Welcome to your Clarity Dashboard</h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Stream-of-consciousness triage organizes atomic thoughts into priorities, helping you filter noise and resolve decision overload.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link
            to="/dump"
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)]"
          >
            <Brain className="w-4 h-4" />
            <span>Start Brain Dump</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white/5 rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Total Brain Dumps</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-outfit font-extrabold text-white">{stats.dumpsCount}</span>
                <span className="text-xs text-gray-500">entries</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Active Thoughts</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-outfit font-extrabold text-indigo-400">{stats.activeCount}</span>
                <span className="text-xs text-gray-500">pending</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">Resolved Tasks</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-outfit font-extrabold text-emerald-400">{stats.resolvedCount}</span>
                <span className="text-xs text-gray-500">cleared</span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <span className="text-[10px] text-rose-500/80 font-bold uppercase tracking-wider block mb-1">Safety Intercepts</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-outfit font-extrabold text-rose-400">{stats.flaggedCount}</span>
                <span className="text-xs text-gray-500">intercepted</span>
              </div>
            </div>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left/Middle Column (Cognitive Load & Focus) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Cognitive Load Health Index */}
              <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">Cognitive Load Index</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Calculated by the ratio of pending decisions to active capacity.</p>
                  </div>
                  <span className={`text-xs font-bold tracking-wider font-outfit ${loadStatus.color}`}>
                    {loadStatus.text} ({loadPercentage}%)
                  </span>
                </div>
                
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${loadStatus.progress}`} style={{ width: `${loadPercentage}%` }} />
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                    <span className="block text-xs font-bold text-rose-400 mb-0.5">{categoryCounts.decide_now}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Decide</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                    <span className="block text-xs font-bold text-amber-400 mb-0.5">{categoryCounts.needs_info}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Needs Info</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                    <span className="block text-xs font-bold text-teal-400 mb-0.5">{categoryCounts.task}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Tasks</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5">
                    <span className="block text-xs font-bold text-slate-400 mb-0.5">{categoryCounts.let_go}</span>
                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Let Go</span>
                  </div>
                </div>
              </div>

              {/* Top Focus Highlight */}
              {topFocus ? (
                <div className="glass-panel p-6 rounded-2xl border-indigo-500/10 shadow-[0_0_25px_rgba(99,102,241,0.03)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Top Priority Task</span>
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
                      PRIORITY: {topFocus.priority_score}
                    </span>
                  </div>
                  
                  <p className="text-base text-gray-200 leading-relaxed font-sans">{topFocus.original_text}</p>
                  
                  {topFocus.follow_up_question && (
                    <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex gap-3">
                      <div className="shrink-0 text-amber-400"><Zap className="w-4 h-4 mt-0.5" /></div>
                      <div>
                        <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block mb-0.5">Sharpening Question</span>
                        <p className="text-xs text-gray-300 leading-normal">{topFocus.follow_up_question}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <Link
                      to="/focus"
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all group"
                    >
                      <span>Resolve in Focus Zone</span>
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-2xl border-dashed border-white/5 text-center flex flex-col items-center justify-center py-16">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="font-outfit text-sm font-bold text-white">Your Mind is Clear</h4>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">No unresolved items in 'Decide Now'. Perform a brain dump to identify new priorities.</p>
                </div>
              )}

            </div>

            {/* Right Column (History / Logs) */}
            <div className="space-y-8">
              
              {/* Quick Navigation links */}
              <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-3">
                <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider mb-2">Triage Quick Links</h3>
                
                <Link to="/dump" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-white/5 transition-all text-xs font-semibold text-gray-300 group">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span>Ingest Thoughts</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link to="/triage" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-white/5 transition-all text-xs font-semibold text-gray-300 group">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-teal-400" />
                    <span>Triage Board</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link to="/focus" className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-white/5 transition-all text-xs font-semibold text-gray-300 group">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Focus Zone</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              {/* Recent Dumps Logs */}
              <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-outfit text-xs font-bold text-white uppercase tracking-wider">Recent Logs</h3>
                  <Link to="/db-explorer" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-wider">
                    View DB Explorer
                  </Link>
                </div>

                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                  {dumps.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-6">No raw brain dumps logged yet.</p>
                  ) : (
                    dumps.slice(0, 4).map(dump => (
                      <div key={dump.id} className="p-3 bg-white/[0.01] border border-white/5 rounded-xl text-[11px] leading-relaxed">
                        <div className="flex items-center justify-between text-gray-500 mb-1 font-mono text-[9px]">
                          <span>LOG #{dump.id}</span>
                          <span>{new Date(dump.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-300 line-clamp-2">{dump.raw_content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
