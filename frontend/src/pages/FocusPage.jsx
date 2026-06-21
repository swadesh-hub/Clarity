import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, HelpCircle, CheckCircle2, ShieldAlert, AlertCircle } from 'lucide-react';
import { apiService } from '../api/apiService';

export default function FocusPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answer, setAnswer] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiService.getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch triage items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Find the single highest priority unresolved "Decide Now" thought
  const focusItem = items
    .filter(item => item.category === 'decide_now' && !item.is_resolved)
    .sort((a, b) => b.priority_score - a.priority_score)[0];

  const handleResolveFocus = async (e) => {
    e.preventDefault();
    if (!focusItem) return;

    setSubmitting(true);
    try {
      // 1. Submit follow up answer if provided
      const updateData = {
        is_resolved: true,
        resolution_summary: resolutionSummary || `Resolved via Focus Zone: ${answer}`
      };

      if (answer.trim() && focusItem.follow_up_question) {
        updateData.user_answer = answer;
      }

      const updated = await apiService.updateItem(focusItem.id, updateData);
      setItems(prev => prev.map(item => item.id === focusItem.id ? updated : item));
      setAnswer('');
      setResolutionSummary('');
    } catch (err) {
      console.error(err);
      alert("Failed to submit resolution.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="font-outfit text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
          Focus Zone
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          Eliminate decision paralysis by resolving your single highest-leverage decision first.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-8 rounded-3xl animate-pulse space-y-6">
          <div className="h-6 w-32 bg-white/5 rounded" />
          <div className="h-20 bg-white/5 rounded" />
          <div className="h-10 bg-white/5 rounded" />
        </div>
      ) : focusItem ? (
        <div className="space-y-6">
          {/* Main Focus Card */}
          <div className="relative glass-panel rounded-3xl p-8 border-indigo-500/10 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
            <div className="absolute top-8 right-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              PRIORITY: {focusItem.priority_score}
            </div>

            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-3 font-outfit">
              Top Leverage Decision
            </span>

            <h2 className="text-xl text-white font-medium leading-relaxed font-sans mb-4">
              {focusItem.original_text}
            </h2>

            {focusItem.category_details && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 mb-6">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1">
                  AI Insight
                </span>
                <p className="text-xs text-gray-400 leading-normal">{focusItem.category_details}</p>
              </div>
            )}

            {/* Follow-up question block */}
            {focusItem.follow_up_question ? (
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
                      Sharpening Question
                    </span>
                    <p className="text-sm text-gray-200 leading-relaxed font-medium">
                      {focusItem.follow_up_question}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleResolveFocus} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Your answer / notes:</label>
                    <textarea
                      required
                      placeholder="Type your notes or response here..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 min-h-[80px]"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 font-medium">Resolution Decision (saved as log):</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., I decided to stick with the elective after scheduling classes."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)] disabled:opacity-50"
                    >
                      <span>Resolve Decision</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // If there is no follow-up question
              <form onSubmit={handleResolveFocus} className="border-t border-white/5 pt-6 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">How did you resolve this?</label>
                  <textarea
                    required
                    placeholder="Type your resolution summary here..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 min-h-[100px]"
                    value={resolutionSummary}
                    onChange={(e) => setResolutionSummary(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                  >
                    <span>Resolve Decision</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        // Completed State
        <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="font-outfit text-2xl font-bold text-white mb-2">Clarity Achieved!</h2>
          <p className="text-gray-400 text-sm max-w-sm">
            All high-priority decisions are resolved. Your cognitive load has been successfully triaged.
          </p>
        </div>
      )}
    </div>
  );
}
