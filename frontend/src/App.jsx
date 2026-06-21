import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BrainDumpPage from './pages/BrainDumpPage';
import TriagePage from './pages/TriagePage';
import FocusPage from './pages/FocusPage';
import DbExplorer from './pages/DbExplorer';
import SettingsPage from './pages/SettingsPage';
import PageTransition from './components/PageTransition';

// Helper component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-cream flex flex-col font-sans antialiased text-charcoal">
        {/* Navigation Bar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 w-full bg-cream">
          <Routes>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/dump" element={<PageTransition><BrainDumpPage /></PageTransition>} />
            <Route path="/triage" element={<PageTransition><TriagePage /></PageTransition>} />
            <Route path="/focus" element={<PageTransition><FocusPage /></PageTransition>} />
            <Route path="/db-explorer" element={<PageTransition><DbExplorer /></PageTransition>} />
            <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
