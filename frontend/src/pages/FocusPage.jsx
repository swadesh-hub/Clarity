import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { apiService } from '../api/apiService';
import ScrollReveal from '../components/ScrollReveal';

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
      <ScrollReveal>
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-forest">
            Focus Zone
          </h1>
          <p className="text-charcoal/60 mt-2 text-sm max-w-md mx-auto leading-relaxed">
            Eliminate decision paralysis by resolving your single highest-leverage decision first.
          </p>
        </div>
      </ScrollReveal>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm flex items-center gap-3">
          <span className="w-2 h-2 bg-rose-500 rounded-full" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-8 rounded-3xl animate-pulse space-y-6">
          <div className="h-6 w-32 bg-cream-dark rounded" />
          <div className="h-20 bg-cream-dark rounded" />
          <div className="h-10 bg-cream-dark rounded" />
        </div>
      ) : focusItem ? (
        <ScrollReveal delay={100}>
          <div className="space-y-6">
            {/* Main Focus Card */}
            <div className="relative glass-panel rounded-3xl p-8 border-border shadow-sm border-t-4 border-t-forest">
              <div className="absolute top-8 right-8 bg-forest/10 text-forest text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                SCORE: {focusItem.priority_score}
              </div>

              <span className="text-xs font-bold text-forest/70 uppercase tracking-widest block mb-3 font-outfit">
                Top Leverage Decision
              </span>

              <h2 className="text-xl text-charcoal font-serif font-semibold leading-relaxed mb-4">
                {focusItem.original_text}
              </h2>

              {focusItem.category_details && (
                <div className="bg-cream/40 border border-border/80 rounded-2xl p-4 mb-6">
                  <span className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider block mb-1">
                    AI Insight
                  </span>
                  <p className="text-xs text-charcoal/80 leading-normal">{focusItem.category_details}</p>
                </div>
              )}

              {/* Follow-up question block */}
              {focusItem.follow_up_question ? (
                <div className="border-t border-border/60 pt-6 space-y-4">
                  <div className="flex gap-3 bg-amber-50 border border-amber-200/60 rounded-2xl p-5">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <HelpCircle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block mb-1">
                        Decision Catalyst
                      </span>
                      <p className="text-sm text-amber-900 leading-relaxed font-semibold">
                        {focusItem.follow_up_question}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleResolveFocus} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Your answer / notes:</label>
                      <textarea
                        required
                        placeholder="Type your notes or response here..."
                        className="w-full bg-cream/40 border border-border rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-forest/40 min-h-[80px]"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Resolution Decision (saved as log):</label>
                      <input
                        type="text"
                        required
                        placeholder="E.g., I decided to stick with the elective after scheduling classes."
                        className="w-full bg-cream/40 border border-border rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3.5 bg-forest hover:bg-forest-light text-white rounded-full font-semibold text-sm transition-all shadow-md disabled:opacity-50"
                      >
                        <span>Resolve Decision</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // If there is no follow-up question
                <form onSubmit={handleResolveFocus} className="border-t border-border/60 pt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-2">How did you resolve this?</label>
                    <textarea
                      required
                      placeholder="Type your resolution summary here..."
                      className="w-full bg-cream/40 border border-border rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-forest/40 min-h-[100px]"
                      value={resolutionSummary}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-3.5 bg-forest hover:bg-forest-light text-white rounded-full font-semibold text-sm transition-all shadow-md"
                    >
                      <span>Resolve Decision</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </ScrollReveal>
      ) : (
        // Completed State
        <ScrollReveal delay={100}>
          <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-sage/40 flex items-center justify-center mb-6">
              <Sparkles className="w-7 h-7 text-forest" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-forest mb-2">Clarity Achieved!</h2>
            <p className="text-charcoal/60 text-sm max-w-sm leading-relaxed">
              All high-priority decisions are resolved. Your cognitive load has been successfully triaged.
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
