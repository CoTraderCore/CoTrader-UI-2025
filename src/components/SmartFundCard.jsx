// components/SmartFundCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';

const SmartFundCard = ({ fund }) => {
  const { state, dispatch } = useDeFi();
  const navigate = useNavigate();

  const handleCardClick = () => {
    // Set the selected fund in context
    dispatch({ type: 'SET_SELECTED_FUND', payload: fund });
    // Navigate to the fund details page
    navigate(`/page/${fund.address}`);
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'high': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div
      className={`group relative p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
        state.isDarkMode 
          ? 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800/70' 
          : 'bg-white/70 border-gray-200 hover:border-gray-300 hover:bg-white/90'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1 transition-colors">
            {fund.name}
          </h3>
          <p className={`text-xs font-mono ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {formatAddress(fund.address)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(fund.risk)}`}>
            {fund.risk || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className={`text-xs ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            TVL
          </p>
          <p className="text-lg font-bold text-green-500">{fund.tvl}</p>
        </div>
        <div>
          <p className={`text-xs ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
            APY
          </p>
          <p className="text-lg font-bold text-blue-500">{fund.apy}</p>
        </div>
      </div>

      {/* Performance and Assets */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Performance
          </span>
          <span className={`text-sm font-medium flex items-center ${
            fund.performance?.startsWith('+') ? 'text-green-500' : 'text-red-500'
          }`}>
            <TrendingUp className="w-3 h-3 mr-1" />
            {fund.performance}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className={`text-sm ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Investors
          </span>
          <span className={`text-sm font-medium flex items-center ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Users className="w-3 h-3 mr-1" />
            {fund.totalInvestors || 0}
          </span>
        </div>

        {/* Assets */}
        <div>
          <p className={`text-xs ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
            Assets
          </p>
          <div className="flex flex-wrap gap-1">
            {(fund.assets || ['ETH']).slice(0, 4).map((asset, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  state.isDarkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {asset}
              </span>
            ))}
            {(fund.assets || []).length > 4 && (
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                state.isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                +{(fund.assets || []).length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 mb-4">
        <span className={`text-xs px-2 py-1 rounded-full ${
          state.isDarkMode 
            ? 'bg-blue-600/20 text-blue-400' 
            : 'bg-blue-50 text-blue-700'
        }`}>
          {fund.category || fund.fundType || 'General'}
        </span>
      </div>

      {/* View Details Button */}
      <button
        onClick={handleCardClick}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
          state.isDarkMode
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
            : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
        } hover:shadow-lg transform hover:scale-[1.02]`}
      >
        <span>View Details</span>
        <ArrowUpRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SmartFundCard;