import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Brain, FileText, Layout, Zap, CheckCircle, 
  ArrowRight, ShieldAlert, Sparkles, ChevronRight, Activity
} from 'lucide-react';
import { apiService } from '../api/apiService';
import ScrollReveal from '../components/ScrollReveal';

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
    if (p > 75) return { text: 'HIGH OVERLOAD', color: 'text-rose-600', progress: 'bg-rose-500' };
    if (p > 40) return { text: 'MODERATE LOAD', color: 'text-amber-600', progress: 'bg-amber-500' };
    return { text: 'LOW LOAD', color: 'text-emerald-700', progress: 'bg-emerald-600' };
  };

  const loadStatus = getLoadStatus(loadPercentage);

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 lg:px-8 space-y-12">
      {/* Hero Section */}
      <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Hero Card */}
          <div className="lg:col-span-7 bg-sage rounded-3xl p-8 lg:p-12 flex flex-col justify-between border border-sage/20 shadow-[0_4px_30px_rgba(27,55,38,0.03)] relative overflow-hidden min-h-[380px]">
            <div className="space-y-5 max-w-xl z-10">
              <div className="inline-flex items-center gap-1.5 text-forest/80 text-xs font-bold uppercase tracking-wider bg-white/40 px-3.5 py-1.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI-Powered Mental Organizer</span>
              </div>
              <h1 className="font-serif text-4xl lg:text-5xl font-bold text-forest leading-tight">
                Dump everything. <br/>Decide one thing.
              </h1>
              <p className="text-forest-light text-sm lg:text-base leading-relaxed">
                Triage unstructured, stream-of-consciousness brain dumps into structured priority matrices. Filter out the noise, schedule tasks, and resolve decision paralysis with ease.
              </p>
            </div>
            <div className="pt-8 z-10">
              <Link
                to="/dump"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-forest hover:bg-forest-light text-white rounded-full font-semibold text-sm transition-all shadow-[0_4px_20px_rgba(27,55,38,0.12)] hover:shadow-[0_6px_25px_rgba(27,55,38,0.22)] hover:translate-y-[-1px] group"
              >
                <span>Start Brain Dump</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Hero Preview Card */}
          <div className="lg:col-span-5 bg-mist rounded-3xl p-8 flex flex-col justify-center gap-4 relative overflow-hidden border border-mist/30">
            <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-widest block mb-2">Triage Pipeline Preview</span>
            
            <div className="bg-white/95 rounded-2xl p-4 border border-white shadow-sm rotate-[-1deg] translate-x-2 transition-all hover:rotate-0 duration-300">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-600 mb-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Decide Now
              </div>
              <p className="text-xs text-charcoal font-semibold font-serif">Bajaj Interview preparation steps</p>
            </div>

            <div className="bg-white/95 rounded-2xl p-4 border border-white shadow-sm rotate-[1deg] translate-x-[-8px] transition-all hover:rotate-0 duration-300">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-teal-600 mb-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full" /> Task
              </div>
              <p className="text-xs text-charcoal font-semibold font-serif">Email Prof. for extension on assignment</p>
            </div>

            <div className="bg-white/95 rounded-2xl p-4 border border-white shadow-sm rotate-[-1deg] translate-x-4 transition-all hover:rotate-0 duration-300">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 mb-1.5 uppercase">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" /> Let Go
              </div>
              <p className="text-xs text-charcoal/60 font-semibold font-serif line-through">Overthinking whether to learn Rust vs Go today</p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-border" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScrollReveal delay={50}>
              <div className="glass-panel p-6 rounded-2xl">
                <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block mb-1">Total Brain Dumps</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-extrabold text-forest">{stats.dumpsCount}</span>
                  <span className="text-xs text-charcoal/60">entries</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="glass-panel p-6 rounded-2xl">
                <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block mb-1">Active Thoughts</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-extrabold text-forest">{stats.activeCount}</span>
                  <span className="text-xs text-charcoal/60">pending</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="glass-panel p-6 rounded-2xl">
                <span className="text-[10px] text-charcoal/50 font-bold uppercase tracking-wider block mb-1">Resolved Tasks</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-extrabold text-forest">{stats.resolvedCount}</span>
                  <span className="text-xs text-charcoal/60">cleared</span>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="glass-panel p-6 rounded-2xl">
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block mb-1">Safety Intercepts</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-serif font-extrabold text-rose-600">{stats.flaggedCount}</span>
                  <span className="text-xs text-charcoal/60 text-rose-500/70">intercepted</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left/Middle Column (Cognitive Load & Focus) */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Cognitive Load Health Index */}
              <ScrollReveal delay={100}>
                <div className="glass-panel p-8 rounded-3xl space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-forest">Cognitive Load Index</h3>
                      <p className="text-xs text-charcoal/60 mt-0.5">Calculated by the ratio of pending decisions to active capacity.</p>
                    </div>
                    <span className={`text-xs font-bold tracking-wider font-outfit px-3 py-1 rounded-full bg-cream ${loadStatus.color}`}>
                      {loadStatus.text} ({loadPercentage}%)
                    </span>
                  </div>
                  
                  <div className="w-full bg-cream-dark h-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${loadStatus.progress}`} style={{ width: `${loadPercentage}%` }} />
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-2 text-center">
                    <div className="bg-cream rounded-xl p-3 border border-border/40">
                      <span className="block text-sm font-bold text-rose-600 mb-0.5">{categoryCounts.decide_now}</span>
                      <span className="text-[8px] text-charcoal/50 font-bold uppercase tracking-wider">Decide</span>
                    </div>
                    <div className="bg-cream rounded-xl p-3 border border-border/40">
                      <span className="block text-sm font-bold text-amber-600 mb-0.5">{categoryCounts.needs_info}</span>
                      <span className="text-[8px] text-charcoal/50 font-bold uppercase tracking-wider">Needs Info</span>
                    </div>
                    <div className="bg-cream rounded-xl p-3 border border-border/40">
                      <span className="block text-sm font-bold text-teal-600 mb-0.5">{categoryCounts.task}</span>
                      <span className="text-[8px] text-charcoal/50 font-bold uppercase tracking-wider">Tasks</span>
                    </div>
                    <div className="bg-cream rounded-xl p-3 border border-border/40">
                      <span className="block text-sm font-bold text-slate-500 mb-0.5">{categoryCounts.let_go}</span>
                      <span className="text-[8px] text-charcoal/50 font-bold uppercase tracking-wider">Let Go</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Top Focus Highlight */}
              <ScrollReveal delay={150}>
                {topFocus ? (
                  <div className="glass-panel p-8 rounded-3xl border-l-4 border-l-sage space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-forest/70 font-bold uppercase tracking-wider bg-sage/50 px-2.5 py-1 rounded">Top Leverage Action</span>
                      <span className="text-[10px] bg-forest/10 text-forest px-2.5 py-0.5 rounded font-bold uppercase">
                        PRIORITY: {topFocus.priority_score}
                      </span>
                    </div>
                    
                    <p className="text-lg text-charcoal font-serif font-medium leading-relaxed">{topFocus.original_text}</p>
                    
                    {topFocus.follow_up_question && (
                      <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 flex gap-4">
                        <div className="shrink-0 text-amber-600"><Zap className="w-5 h-5 mt-0.5" /></div>
                        <div>
                          <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block mb-0.5">Decision Catalyst</span>
                          <p className="text-sm text-charcoal/90 leading-relaxed font-medium">{topFocus.follow_up_question}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-border">
                      <Link
                        to="/focus"
                        className="flex items-center gap-1.5 text-xs text-forest hover:text-forest-light font-bold transition-all group"
                      >
                        <span>Resolve in Focus Zone</span>
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-10 rounded-3xl border-dashed border-border text-center flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 rounded-full bg-sage/40 flex items-center justify-center mb-4">
                      <CheckCircle className="w-5 h-5 text-forest" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-forest">Your Mind is Clear</h4>
                    <p className="text-xs text-charcoal/50 max-w-xs mt-1">No unresolved items in 'Decide Now'. Perform a brain dump to identify new priorities.</p>
                  </div>
                )}
              </ScrollReveal>

            </div>

            {/* Right Column (History / Logs) */}
            <div className="space-y-8">
              
              {/* Quick Navigation links */}
              <ScrollReveal delay={150}>
                <div className="glass-panel p-6 rounded-2xl space-y-3">
                  <h3 className="font-serif text-sm font-bold text-forest mb-2">Triage Quick Links</h3>
                  
                  <Link to="/dump" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-cream/50 border border-border/80 transition-all text-xs font-semibold text-charcoal group">
                    <div className="flex items-center gap-2.5">
                      <Brain className="w-4 h-4 text-forest" />
                      <span>Ingest Thoughts</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal/40 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link to="/triage" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-cream/50 border border-border/80 transition-all text-xs font-semibold text-charcoal group">
                    <div className="flex items-center gap-2.5">
                      <Layout className="w-4 h-4 text-forest" />
                      <span>Triage Board</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal/40 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link to="/focus" className="flex items-center justify-between p-3.5 rounded-xl hover:bg-cream/50 border border-border/80 transition-all text-xs font-semibold text-charcoal group">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-4 h-4 text-forest" />
                      <span>Focus Zone</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-charcoal/40 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </ScrollReveal>

              {/* Recent Dumps Logs */}
              <ScrollReveal delay={200}>
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm font-bold text-forest">Recent Logs</h3>
                    <Link to="/db-explorer" className="text-[10px] text-forest hover:text-forest-light font-bold uppercase tracking-wider">
                      View DB Explorer
                    </Link>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {dumps.length === 0 ? (
                      <p className="text-xs text-charcoal/40 text-center py-8 italic">No raw brain dumps logged yet.</p>
                    ) : (
                      dumps.slice(0, 4).map(dump => (
                        <div key={dump.id} className="p-3 bg-cream/40 border border-border rounded-xl text-[11px] leading-relaxed">
                          <div className="flex items-center justify-between text-charcoal/40 mb-1 font-mono text-[9px]">
                            <span>LOG #{dump.id}</span>
                            <span>{new Date(dump.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-charcoal/80 line-clamp-2">{dump.raw_content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
