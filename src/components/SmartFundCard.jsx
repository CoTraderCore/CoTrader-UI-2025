// components/SmartFundCard.js
import React from 'react';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';

const SmartFundCard = ({ fund }) => {
  const { state, dispatch } = useDeFi();

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'high': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const viewFundDetails = () => {
    dispatch({ type: 'SET_SELECTED_FUND', payload: fund });
    dispatch({ type: 'SET_CURRENT_PAGE', payload: 'fund-details' });
  };

  return (
    <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-105 border backdrop-blur-sm ${
      state.isDarkMode 
        ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800/70' 
        : 'bg-white/50 border-gray-200 hover:bg-white/70'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{fund.name}</h3>
          <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {fund.description}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRiskColor(fund.risk)} text-white`}>
          {fund.risk} Risk
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>TVL</p>
          <p className="text-2xl font-bold text-green-500">{fund.tvl}</p>
        </div>
        <div>
          <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>APY</p>
          <p className="text-2xl font-bold text-blue-500">{fund.apy}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Performance</span>
        <span className="text-green-500 font-semibold flex items-center">
          <ArrowUpRight className="w-4 h-4 mr-1" />
          {fund.performance}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {fund.assets.map((asset, index) => (
          <span 
            key={index}
            className={`px-2 py-1 rounded-lg text-xs font-medium ${
              state.isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {asset}
          </span>
        ))}
      </div>

      <button
        onClick={viewFundDetails}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <span>View Details</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SmartFundCard;