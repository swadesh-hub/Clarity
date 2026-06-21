import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Brain, Activity, Database, Settings, HelpCircle, PenTool, LayoutGrid, Zap } from 'lucide-react';
import { apiService } from '../api/apiService';

export default function Navbar() {
  const [backendStatus, setBackendStatus] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await apiService.getHealth();
        setBackendStatus('connected');
      } catch (err) {
        setBackendStatus('disconnected');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full h-[70px] bg-dark-bg/85 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8">
      {/* Brand logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <Brain className="w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
        <div>
          <span className="font-outfit text-lg font-bold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            CLARITY
          </span>
          <span className="block text-[10px] text-gray-500 font-medium tracking-widest uppercase">
            Cognitive Triage
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex items-center gap-2">
        <NavLink to="/" end className={navLinkClass}>
          <Activity className="w-4 h-4" />
          <span>Home</span>
        </NavLink>
        <NavLink to="/dump" className={navLinkClass}>
          <PenTool className="w-4 h-4" />
          <span>Brain Dump</span>
        </NavLink>
        <NavLink to="/triage" className={navLinkClass}>
          <LayoutGrid className="w-4 h-4" />
          <span>Triage Board</span>
        </NavLink>
        <NavLink to="/focus" className={navLinkClass}>
          <Zap className="w-4 h-4" />
          <span>Focus Zone</span>
        </NavLink>
        <NavLink to="/db-explorer" className={navLinkClass}>
          <Database className="w-4 h-4" />
          <span>DB Explorer</span>
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* Backend Status indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            backendStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : backendStatus === 'disconnected'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected'
                ? 'bg-emerald-400 animate-ping'
                : backendStatus === 'disconnected'
                ? 'bg-rose-400'
                : 'bg-amber-400 animate-bounce'
            }`}
          />
          <span className="font-outfit tracking-wide uppercase text-[10px]">
            API: {backendStatus}
          </span>
        </div>
      </div>
    </nav>
  );
}
