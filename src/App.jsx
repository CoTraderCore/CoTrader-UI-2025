// App.js
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { DeFiProvider, useDeFi } from './context/DeFiContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

// Main App Component
const App = () => {
  const { state } = useDeFi();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      state.isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Navbar />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`lg:hidden fixed top-20 left-4 z-30 p-2 rounded-lg ${
            state.isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } shadow-lg`}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Main content */}
        <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-6">
          <MainContent />
        </main>
      </div>
    </div>
  );
};

// App with Provider
const AppWithProvider = () => {
  return (
    <DeFiProvider>
      <App />
    </DeFiProvider>
  );
};

export default AppWithProvider;