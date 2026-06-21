import React, { useState, useEffect } from 'react';
import { Settings, ShieldAlert, Plus, Trash2, Key, HelpCircle, Save, Info } from 'lucide-react';
import { apiService } from '../api/apiService';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [safetyKeywords, setSafetyKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New settings forms state
  const [geminiKey, setGeminiKey] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const fetchSettingsAndKeywords = async () => {
    try {
      setLoading(true);
      const [settingsData, keywordsData] = await Promise.all([
        apiService.getSettings(),
        apiService.getSafetyKeywords()
      ]);
      setSettings(settingsData);
      setSafetyKeywords(keywordsData);
      
      if (settingsData.GEMINI_API_KEY) {
        setGeminiKey(settingsData.GEMINI_API_KEY);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to sync application settings. Verify the backend Express server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndKeywords();
  }, []);

  const handleSaveGeminiKey = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateSetting('GEMINI_API_KEY', geminiKey);
      alert("Gemini API Key updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save API key.");
    }
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      const added = await apiService.addSafetyKeyword(newKeyword);
      setSafetyKeywords(prev => [...prev, added].sort((a, b) => a.keyword.localeCompare(b.keyword)));
      setNewKeyword('');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to add keyword.");
    }
  };

  const handleDeleteKeyword = async (id) => {
    try {
      await apiService.deleteSafetyKeyword(id);
      setSafetyKeywords(prev => prev.filter(k => k.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete keyword.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-8 space-y-10">
      <div>
        <h1 className="font-outfit text-2xl font-bold tracking-wider text-white">System Settings</h1>
        <p className="text-xs text-gray-500 mt-1">Configure your AI priorities, distress intercepts, and configuration parameters.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-white/5 rounded-2xl" />
          <div className="h-40 bg-white/5 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Column - System Keys */}
          <div className="md:col-span-2 space-y-8">
            {/* API Config Panel */}
            <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">AI API Credentials</h3>
              </div>

              <form onSubmit={handleSaveGeminiKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Google Gemini API Key</label>
                  <input
                    type="password"
                    placeholder="Enter your GEMINI_API_KEY..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 font-mono"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                  <span className="block text-[10px] text-gray-500 mt-1.5">
                    This key allows locally overriding the Cloudflare Worker default endpoints if needed.
                  </span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Key</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Ingestion Info Panel */}
            <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">Pipeline Processing</h3>
              </div>

              <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
                <p>
                  Clarity leverages the serverless cloud endpoints at <code className="text-indigo-400">workers.dev</code> to perform advanced Natural Language Processing.
                </p>
                <p>
                  Every brain dump submitted is automatically routed through a safety regex sweep, segmented into individual thoughts, prioritized, and scored via Llama 3 models.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Distress keywords dictionary */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 space-y-4 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">Safety Intercepts</h3>
            </div>

            <p className="text-[10px] text-gray-500 leading-normal">
              Phrases matching these words are flagged as distress, preventing them from being archived or muted under 'Let Go'.
            </p>

            {/* Add new word form */}
            <form onSubmit={handleAddKeyword} className="flex gap-2">
              <input
                type="text"
                placeholder="Add word..."
                required
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/50"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* Keyword tags list */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {safetyKeywords.length === 0 ? (
                <span className="text-[10px] text-gray-600 italic block py-4 text-center">No words configured.</span>
              ) : (
                safetyKeywords.map(keyword => (
                  <div 
                    key={keyword.id}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-lg p-2 text-xs hover:border-rose-500/20 transition-all group"
                  >
                    <span className="text-gray-300 font-medium font-mono">{keyword.keyword}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteKeyword(keyword.id)}
                      className="text-gray-600 hover:text-rose-400 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
