import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BrainDumpPage from './pages/BrainDumpPage';
import TriagePage from './pages/TriagePage';
import FocusPage from './pages/FocusPage';
import DbExplorer from './pages/DbExplorer';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg flex flex-col font-sans antialiased text-gray-200">
        {/* Navigation Bar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 w-full bg-[#0a0c10]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dump" element={<BrainDumpPage />} />
            <Route path="/triage" element={<TriagePage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/db-explorer" element={<DbExplorer />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
