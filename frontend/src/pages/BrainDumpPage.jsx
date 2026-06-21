import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, HelpCircle, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { apiService } from '../api/apiService';

export default function BrainDumpPage() {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  const loadingTexts = [
    "Ingesting raw brain dump stream...",
    "Running local safety checks & guardrails...",
    "Calling AI classifier engine...",
    "Segmenting into atomic thoughts & items...",
    "Calculating priority matrix scores...",
    "Saving records to SQLite database..."
  ];

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setText(prev => (prev ? prev + ' ' : '') + finalTranscript);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Loading animation step cycle
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingTexts.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const startSpeech = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (e) {
      console.error(e);
    }
  };

  const stopSpeech = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleLoadDemo = () => {
    setText("worried about the bajaj interview, also need to decide if I drop DL elective, mom wants me to visit this weekend, should I learn rust, forgot to email professor about extension, feels like I'm behind on everything");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please write or record some thoughts first.");
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setError(null);

    try {
      await apiService.createDump(text);
      setLoading(false);
      navigate('/triage');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "Failed to process brain dump. Verify the backend API is running.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center mb-10">
        <h1 className="font-outfit text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
          Empty Your Mind
        </h1>
        <p className="text-gray-400 mt-2 text-sm max-w-lg mx-auto">
          Type or voice-record a stream-of-consciousness brain dump. Don't worry about punctuation, structure, or priority — we'll classify and filter it for you.
        </p>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600/30 border-t-indigo-400 animate-spin mb-6" />
          <p className="font-outfit text-lg text-indigo-400 font-semibold tracking-wide animate-pulse">
            {loadingTexts[loadingStep]}
          </p>
          <p className="text-xs text-gray-500 mt-3">Connecting to Cloudflare Worker Triage pipeline...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative glass-panel rounded-3xl overflow-hidden p-6 border-white/5 shadow-2xl">
            <textarea
              className="w-full min-h-[220px] bg-transparent text-gray-200 placeholder-gray-600 border-0 focus:ring-0 focus:outline-none text-base resize-y leading-relaxed font-sans"
              placeholder="Start typing your stream of consciousness here... ('I have so much on my plate, need to decide on my elective, email prof, visit mom...')"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />

            {isRecording && (
              <div className="absolute top-6 right-6 flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 bg-rose-500 rounded-full" />
                Listening...
              </div>
            )}

            {/* Formatting tooltips */}
            <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tips: List decisions, chores, worries, ideas all in one go.</span>
              </div>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Load Demo Load
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopSpeech}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                >
                  <MicOff className="w-4 h-4" />
                  Stop Voice Input
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSpeech}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                >
                  <Mic className="w-4 h-4" />
                  Record Voice
                </button>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!text.trim()}
            >
              <Send className="w-4 h-4" />
              Triage Thoughts
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
