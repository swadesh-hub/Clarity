import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Trash2, Edit3, ShieldAlert,
  Search, SlidersHorizontal, ArrowUpDown, ChevronDown, Check, X
} from 'lucide-react';
import { apiService } from '../api/apiService';

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
    { id: 'decide_now', title: 'Decide Now', accent: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { id: 'needs_info', title: 'Needs Info', accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { id: 'task', title: 'Tasks', accent: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { id: 'let_go', title: 'Let Go', accent: 'bg-slate-500/10 text-slate-400 border-slate-500/20' }
  ];

  return (
    <div className="py-8 px-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-outfit text-2xl font-bold tracking-wider text-white">Triage Board</h1>
          <p className="text-xs text-gray-500 mt-1">Manage and evaluate your classified thoughts based on priority scoring.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search thoughts..."
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 w-[200px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === 'active' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === 'resolved' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Resolved
            </button>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none p-0 text-xs text-gray-200 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="priority_score">Priority Score</option>
              <option value="created_at">Date Created</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[400px]">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="glass-panel p-6 rounded-2xl animate-pulse space-y-4">
              <div className="h-6 w-24 bg-white/5 rounded" />
              <div className="h-28 bg-white/5 rounded" />
              <div className="h-14 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {columns.map(col => {
            const colItems = getColItems(col.id);
            return (
              <div key={col.id} className="flex flex-col min-h-[500px]">
                {/* Column header */}
                <div className={`p-4 rounded-t-2xl border-t border-x ${col.accent} flex items-center justify-between`}>
                  <h3 className="font-outfit text-sm font-bold tracking-wide uppercase">{col.title}</h3>
                  <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-bold">{colItems.length}</span>
                </div>

                {/* Column body */}
                <div className="flex-1 bg-white/[0.02] border-x border-b border-white/5 rounded-b-2xl p-4 space-y-4 min-h-[450px]">
                  {colItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                      <p className="text-xs text-gray-600 font-medium">Empty column</p>
                    </div>
                  ) : (
                    colItems.map(item => (
                      <div 
                        key={item.id} 
                        className={`relative glass-card p-4 rounded-xl flex flex-col justify-between ${
                          item.is_safety_flagged ? 'border-l-4 border-l-rose-500' : ''
                        }`}
                      >
                        {/* Upper Card Block */}
                        <div>
                          {item.is_safety_flagged === 1 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 mb-2 uppercase tracking-wider">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Distress Intercepted</span>
                            </div>
                          )}

                          <p className="text-sm text-gray-200 leading-relaxed font-sans">{item.original_text}</p>
                          
                          {item.category_details && (
                            <p className="text-xs text-gray-500 mt-2 italic leading-normal">
                              "{item.category_details}"
                            </p>
                          )}
                        </div>

                        {/* Card metadata / Actions */}
                        <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                          {/* Priority Score badge */}
                          <div 
                            title={`Urgency: ${item.urgency} | Stakes: ${item.stakes} | Reversibility: ${item.reversibility}`}
                            className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider cursor-help"
                          >
                            PRIO: {item.priority_score}
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
                                className="p-1.5 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>RESOLVED</span>
                              </div>
                            )}

                            {/* Edit button */}
                            <button
                              onClick={() => setEditingItem({ ...item })}
                              title="Edit Factors"
                              className="p-1.5 hover:bg-white/5 text-gray-500 hover:text-indigo-400 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete Item"
                              className="p-1.5 hover:bg-rose-500/10 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Column shift selector */}
                        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500">
                          <span>Shift Column:</span>
                          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-md">
                            {columns.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                disabled={item.category === c.id}
                                onClick={() => handleUpdateCategory(item.id, c.id)}
                                className={`px-1.5 py-0.5 rounded uppercase font-bold text-[8px] transition-all ${
                                  item.category === c.id 
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-300'
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
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-2xl border-white/10 p-6 shadow-2xl relative">
            <h2 className="font-outfit text-lg font-bold text-white mb-4">Edit Triage Factors</h2>
            <form onSubmit={handleUpdateFactors} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Thought Text</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                  value={editingItem.original_text}
                  onChange={(e) => setEditingItem({ ...editingItem, original_text: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Classifier Details (AI Insight)</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                  value={editingItem.category_details || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category_details: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5" title="Urgency (1-10)">Urgency</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                    value={editingItem.urgency}
                    onChange={(e) => setEditingItem({ ...editingItem, urgency: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5" title="Stakes/Impact (1-10)">Stakes</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                    value={editingItem.stakes}
                    onChange={(e) => setEditingItem({ ...editingItem, stakes: parseInt(e.target.value, 10) })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5" title="Reversibility (1-10)">Reversibility</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                    value={editingItem.reversibility}
                    onChange={(e) => setEditingItem({ ...editingItem, reversibility: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-2xl border-white/10 p-6 shadow-2xl relative">
            <h2 className="font-outfit text-lg font-bold text-white mb-2">Resolve Thought</h2>
            <p className="text-xs text-gray-500 mb-4">"{resolvingItem.original_text}"</p>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">What did you decide or do?</label>
                <textarea
                  required
                  placeholder="E.g., I decided to drop the elective and stick to my core courses for a balanced workload."
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50"
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setResolvingItem(null);
                    setResolutionSummary('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-gray-200 bg-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg"
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
