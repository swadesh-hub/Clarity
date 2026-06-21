import React, { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, Key, Info, Save } from 'lucide-react';
import { apiService } from '../api/apiService';
import ScrollReveal from '../components/ScrollReveal';

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
    <div className="max-w-4xl mx-auto py-10 px-6 lg:px-8 space-y-10">
      <ScrollReveal>
        <div>
          <h1 className="font-serif text-3xl font-bold text-forest">System Settings</h1>
          <p className="text-xs text-charcoal/60 mt-1">Configure your AI priorities, distress intercepts, and configuration parameters.</p>
        </div>
      </ScrollReveal>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-white rounded-2xl border border-border" />
          <div className="h-40 bg-white rounded-2xl border border-border" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Column - System Keys */}
          <div className="md:col-span-2 space-y-8">
            {/* API Config Panel */}
            <ScrollReveal delay={50}>
              <div className="glass-panel p-6 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-forest/10 border border-forest/20 text-forest">
                    <Key className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider">AI API Credentials</h3>
                </div>

                <form onSubmit={handleSaveGeminiKey} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-charcoal/50 uppercase tracking-wider mb-2">Google Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="Enter your GEMINI_API_KEY..."
                      className="w-full bg-cream/40 border border-border rounded-xl px-4 py-3 text-sm text-charcoal focus:outline-none focus:border-forest/40 font-mono"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <span className="block text-[10px] text-charcoal/40 mt-1.5 leading-normal">
                      This key allows locally overriding the Cloudflare Worker default endpoints if needed.
                    </span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-forest hover:bg-forest-light text-white rounded-full font-semibold text-xs transition-all shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Key</span>
                    </button>
                  </div>
                </form>
              </div>
            </ScrollReveal>

            {/* Ingestion Info Panel */}
            <ScrollReveal delay={100}>
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-forest/10 border border-forest/20 text-forest">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider">Pipeline Processing</h3>
                </div>

                <div className="text-xs text-charcoal/70 space-y-3.5 leading-relaxed">
                  <p>
                    Clarity leverages the serverless cloud endpoints at <code className="text-forest bg-sage/35 px-1.5 py-0.5 rounded font-mono font-medium">workers.dev</code> to perform advanced Natural Language Processing.
                  </p>
                  <p>
                    Every brain dump submitted is automatically routed through a safety regex sweep, segmented into individual thoughts, prioritized, and scored via Llama 3 models.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column - Distress keywords dictionary */}
          <ScrollReveal delay={150}>
            <div className="glass-panel p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-sm font-bold text-forest uppercase tracking-wider">Safety Intercepts</h3>
              </div>

              <p className="text-[10px] text-charcoal/50 leading-normal">
                Phrases matching these words are flagged as distress, preventing them from being archived or muted under 'Let Go'.
              </p>

              {/* Add new word form */}
              <form onSubmit={handleAddKeyword} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add word..."
                  required
                  className="flex-1 bg-cream/40 border border-border rounded-xl px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-forest/40"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2.5 bg-forest hover:bg-forest-light text-white rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {/* Keyword tags list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {safetyKeywords.length === 0 ? (
                  <span className="text-[10px] text-charcoal/40 italic block py-4 text-center">No words configured.</span>
                ) : (
                  safetyKeywords.map(keyword => (
                    <div 
                      key={keyword.id}
                      className="flex items-center justify-between bg-cream/35 border border-border/80 rounded-xl p-2 text-xs hover:border-rose-300 transition-all group"
                    >
                      <span className="text-charcoal/80 font-semibold font-mono">{keyword.keyword}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteKeyword(keyword.id)}
                        className="text-charcoal/30 hover:text-rose-600 p-0.5 rounded transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      )}
    </div>
  );
}
