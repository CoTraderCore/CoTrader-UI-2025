// components/Navbar.js
import React, { useState } from 'react';
import { TrendingUp, Sun, Moon } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import Wallet from './Wallet';

const Navbar = () => {
  const { state, dispatch } = useDeFi();
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const connectWallet = async () => {
    // Mock wallet connection
    setIsWalletConnected(true);
  };

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-lg border-b transition-all duration-300 ${
      state.isDarkMode 
        ? 'bg-gray-900/80 border-gray-800 text-white' 
        : 'bg-white/80 border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button 
              onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dashboard' })}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                CoTrader
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                state.isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              {state.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <button
              onClick={connectWallet}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isWalletConnected
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>{isWalletConnected ? '0x1234...5678' : 'Connect Wallet'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;