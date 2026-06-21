import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { apiService } from '../api/apiService';

export default function Navbar() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 text-sm font-medium transition-colors duration-200 relative ${
      isActive
        ? 'text-forest font-semibold after:absolute after:bottom-[-24px] after:left-0 after:right-0 after:h-[2px] after:bg-forest'
        : 'text-charcoal/70 hover:text-forest'
    }`;

  return (
    <nav className={`sticky top-0 z-50 w-full h-[70px] bg-white/80 backdrop-blur-md transition-all duration-300 flex items-center justify-between px-8 ${
      scrolled ? 'border-b border-border/80 shadow-sm' : 'border-b border-transparent'
    }`}>
      {/* Brand logo */}
      <Link to="/" className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="font-serif text-2xl font-bold tracking-tight text-forest leading-none">
            Clarity
          </span>
          <span className="block text-[8px] text-forest-light font-bold tracking-widest uppercase mt-0.5">
            Cognitive Triage
          </span>
        </div>
      </Link>

      {/* Nav items */}
      <div className="flex items-center gap-6">
        <NavLink to="/" end className={navLinkClass}>
          Home
        </NavLink>
        <NavLink to="/dump" className={navLinkClass}>
          Brain Dump
        </NavLink>
        <NavLink to="/triage" className={navLinkClass}>
          Triage Board
        </NavLink>
        <NavLink to="/focus" className={navLinkClass}>
          Focus Zone
        </NavLink>
        <NavLink to="/db-explorer" className={navLinkClass}>
          DB Explorer
        </NavLink>
        <NavLink to="/settings" className={navLinkClass}>
          Settings
        </NavLink>
      </div>

      {/* Right Side Actions & API Dot */}
      <div className="flex items-center gap-4">
        {/* Status Dot */}
        <div 
          title={`API: ${backendStatus}`}
          className="flex items-center gap-1.5 text-xs text-charcoal/60"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full border border-white ${
              backendStatus === 'connected'
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : backendStatus === 'disconnected'
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-wider hidden md:inline">
            {backendStatus === 'connected' ? 'Synced' : 'Offline'}
          </span>
        </div>

        {/* CTA Button */}
        <Link
          to="/dump"
          className="inline-flex items-center justify-center px-4 py-2 bg-forest hover:bg-forest-light text-white text-xs font-semibold rounded-full transition-all duration-300 hover:shadow-md transform hover:-translate-y-[1px]"
        >
          Start Brain Dump
        </Link>
      </div>
    </nav>
  );
}
