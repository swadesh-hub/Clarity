import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Trash2, Edit3, ShieldAlert,
  Search, ArrowUpDown, Check, X
} from 'lucide-react';
import { apiService } from '../api/apiService';
import ScrollReveal from '../components/ScrollReveal';

export default function TriagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, resolved
  const [sortBy, setSortBy] = useState('priority_score'); // priority_score, created_at
  
  // Edit & Resolve state
  const [editingItem, setEditingItem] = useState(null);
  const [resolvingItem, setResolvingItem] = useState(null);
  const [resolutionSummary, setResolutionSummary] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiService.getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch triage items. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleUpdateCategory = async (id, newCategory) => {
    try {
      const updated = await apiService.updateItem(id, { category: newCategory });
      setItems(prev => prev.map(item => item.id === id ? updated : item));
    } catch (err) {
      console.error(err);
      alert("Failed to update category.");
    }
  };

  const handleUpdateFactors = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updated = await apiService.updateItem(editingItem.id, {
        urgency: editingItem.urgency,
        stakes: editingItem.stakes,
        reversibility: editingItem.reversibility,
        original_text: editingItem.original_text,
        category_details: editingItem.category_details
      });
      setItems(prev => prev.map(item => item.id === editingItem.id ? updated : item));
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      const updated = await apiService.updateItem(resolvingItem.id, {
        is_resolved: true,
        resolution_summary: resolutionSummary
      });
      setItems(prev => prev.map(item => item.id === resolvingItem.id ? updated : item));
      setResolvingItem(null);
      setResolutionSummary('');
    } catch (err) {
      console.error(err);
      alert("Failed to resolve thought.");
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this thought?")) return;
    try {
      await apiService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete thought.");
    }
  };

  // Filter & Sort Logic
  const filteredItems = items.filter(item => {
    const matchesSearch = item.original_text.toLowerCase().includes(search.toLowerCase()) ||
                          (item.category_details && item.category_details.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && !item.is_resolved) ||
                          (statusFilter === 'resolved' && item.is_resolved);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'priority_score') {
      return b.priority_score - a.priority_score;
    } else {
      return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Categorize items for columns
  const getColItems = (category) => filteredItems.filter(item => item.category === category);

  const columns = [
    { id: 'decide_now', title: 'Decide Now', accent: 'bg-rose-50 border-rose-200/60 text-rose-700', itemAccent: 'border-l-4 border-l-rose-500' },
    { id: 'needs_info', title: 'Needs Info', accent: 'bg-amber-50 border-amber-200/60 text-amber-700', itemAccent: 'border-l-4 border-l-amber-500' },
    { id: 'task', title: 'Tasks', accent: 'bg-emerald-50 border-emerald-200/60 text-emerald-700', itemAccent: 'border-l-4 border-l-emerald-500' },
    { id: 'let_go', title: 'Let Go', accent: 'bg-slate-50 border-slate-200/60 text-slate-700', itemAccent: 'border-l-4 border-l-slate-400' }
  ];

  return (
    <div className="py-8 px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-forest">Triage Board</h1>
          <p className="text-xs text-charcoal/60 mt-1">Manage and evaluate your classified thoughts based on priority scoring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-charcoal/40" />
            <input
              type="text"
              placeholder="Search thoughts..."
              className="bg-white border border-border rounded-full pl-9 pr-4 py-2 text-sm text-charcoal focus:outline-none focus:border-forest/40 w-[200px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-white border border-border rounded-full p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${statusFilter === 'all' ? 'bg-forest text-white' : 'text-charcoal/60 hover:text-forest'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${statusFilter === 'active' ? 'bg-forest text-white' : 'text-charcoal/60 hover:text-forest'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-full font-semibold transition-colors ${statusFilter === 'resolved' ? 'bg-forest text-white' : 'text-charcoal/60 hover:text-forest'}`}
            >
              Resolved
            </button>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-white border border-border rounded-full px-4 py-2 text-xs text-charcoal/60">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none p-0 text-xs font-semibold text-charcoal/70 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="priority_score">Priority Score</option>
              <option value="created_at">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[400px]">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
              <div className="h-6 w-24 bg-cream-dark rounded" />
              <div className="h-28 bg-cream-dark rounded" />
              <div className="h-14 bg-cream-dark rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {columns.map((col, idx) => {
            const colItems = getColItems(col.id);
            return (
              <ScrollReveal key={col.id} delay={idx * 80}>
                <div className="flex flex-col min-h-[500px]">
                  {/* Column header */}
                  <div className={`p-4 rounded-t-2xl border-t border-x ${col.accent} flex items-center justify-between`}>
                    <h3 className="font-serif text-sm font-bold tracking-wide uppercase">{col.title}</h3>
                    <span className="text-xs bg-white/70 px-2.5 py-0.5 rounded-full font-bold text-charcoal/80">{colItems.length}</span>
                  </div>

                  {/* Column body */}
                  <div className="flex-1 bg-white/40 border-x border-b border-border rounded-b-2xl p-4 space-y-4 min-h-[450px]">
                    {colItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-20 text-center border-2 border-dashed border-border/80 rounded-xl">
                        <p className="text-xs text-charcoal/40 font-medium italic">No items triaged</p>
                      </div>
                    ) : (
                      colItems.map(item => (
                        <div 
                          key={item.id} 
                          className={`relative glass-card p-4 rounded-xl flex flex-col justify-between border border-border shadow-sm bg-white hover:shadow-md ${
                            col.itemAccent
                          } ${item.is_safety_flagged ? '!border-l-rose-600' : ''}`}
                        >
                          {/* Upper Card Block */}
                          <div>
                            {item.is_safety_flagged === 1 && (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-600 mb-2 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded w-max">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Distress Flagged</span>
                              </div>
                            )}

                            <p className="text-sm text-charcoal leading-relaxed font-sans font-medium">{item.original_text}</p>
                            
                            {item.category_details && (
                              <p className="text-xs text-charcoal/50 mt-2 italic leading-normal border-t border-border/40 pt-2">
                                "{item.category_details}"
                              </p>
                            )}
                          </div>

                          {/* Card metadata / Actions */}
                          <div className="border-t border-border/60 pt-3 mt-3 flex items-center justify-between">
                            {/* Priority Score badge */}
                            <div 
                              title={`Urgency: ${item.urgency} | Stakes: ${item.stakes} | Reversibility: ${item.reversibility}`}
                              className="bg-forest/10 text-forest border border-forest/20 rounded-md px-2 py-0.5 text-[9px] font-bold tracking-wider cursor-help"
                            >
                              SCORE: {item.priority_score}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                              {/* Resolve button */}
                              {!item.is_resolved ? (
                                <button
                                  onClick={() => {
                                    setResolvingItem(item);
                                    setResolutionSummary('');
                                  }}
                                  title="Resolve Item"
                                  className="p-1.5 hover:bg-emerald-50 text-charcoal/50 hover:text-emerald-600 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>RESOLVED</span>
                                </div>
                              )}

                              {/* Edit button */}
                              <button
                                onClick={() => setEditingItem({ ...item })}
                                title="Edit Factors"
                                className="p-1.5 hover:bg-cream-dark text-charcoal/50 hover:text-forest rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                title="Delete Item"
                                className="p-1.5 hover:bg-rose-50 text-charcoal/40 hover:text-rose-600 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Column shift selector */}
                          <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[9px] text-charcoal/50">
                            <span>Move:</span>
                            <div className="flex items-center gap-1 bg-cream-dark p-0.5 rounded-md">
                              {columns.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  disabled={item.category === c.id}
                                  onClick={() => handleUpdateCategory(item.id, c.id)}
                                  className={`px-1.5 py-0.5 rounded uppercase font-bold text-[8px] transition-all ${
                                    item.category === c.id 
                                      ? 'bg-forest text-white shadow-sm'
                                      : 'text-charcoal/40 hover:text-forest'
                                  }`}
                                >
                                  {c.id.substring(0, 3)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#F8F6F2]/75 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-3xl border-border p-6 shadow-xl relative bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-serif text-lg font-bold text-forest">Edit Triage Factors</h2>
              <button 
                type="button" 
                onClick={() => setEditingItem(null)} 
                className="p-1 hover:bg-cream-dark rounded-full text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateFactors} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Thought Text</label>
                <textarea
                  className="w-full bg-cream/40 border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                  value={editingItem.original_text}
                  onChange={(e) => setEditingItem({ ...editingItem, original_text: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">Classifier Details (AI Insight)</label>
                <textarea
                  className="w-full bg-cream/40 border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                  value={editingItem.category_details || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category_details: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5" title="Urgency (1-10)">Urgency</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-cream/40 border border-border rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                    value={editingItem.urgency}
                    onChange={(e) => setEditingItem({ ...editingItem, urgency: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5" title="Stakes/Impact (1-10)">Stakes</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-cream/40 border border-border rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                    value={editingItem.stakes}
                    onChange={(e) => setEditingItem({ ...editingItem, stakes: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-charcoal/60 uppercase tracking-wider mb-1.5" title="Reversibility (1-10)">Reversibility</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-cream/40 border border-border rounded-xl px-4 py-2 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                    value={editingItem.reversibility}
                    onChange={(e) => setEditingItem({ ...editingItem, reversibility: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-charcoal/60 hover:text-charcoal bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-forest hover:bg-forest-light rounded-full transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE DIALOG */}
      {resolvingItem && (
        <div className="fixed inset-0 z-50 bg-[#F8F6F2]/75 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-3xl border-border p-6 shadow-xl relative bg-white">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-serif text-lg font-bold text-forest">Resolve Thought</h2>
              <button 
                type="button" 
                onClick={() => { setResolvingItem(null); setResolutionSummary(''); }} 
                className="p-1 hover:bg-cream-dark rounded-full text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-charcoal/60 mb-4 font-medium">"{resolvingItem.original_text}"</p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal/60 uppercase tracking-wider mb-1.5">What did you decide or do?</label>
                <textarea
                  required
                  placeholder="E.g., I decided to drop the elective and stick to my core courses for a balanced workload."
                  className="w-full min-h-[100px] bg-cream/40 border border-border rounded-xl px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:border-forest/40"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setResolvingItem(null);
                    setResolutionSummary('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-charcoal/60 hover:text-charcoal bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-forest hover:bg-forest-light rounded-full transition-all shadow-md"
                >
                  Confirm Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
