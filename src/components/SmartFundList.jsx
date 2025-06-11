// components/SmartFundList.js
import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import SmartFundCard from './SmartFundCard';

const SmartFundList = () => {
  const { state } = useDeFi();

  const stats = [
    { label: 'Total TVL', value: '$16.2M', change: '+12.5%', color: 'text-green-500' },
    { label: 'Active Funds', value: '24', change: '+3', color: 'text-blue-500' },
    { label: 'Total Users', value: '1,247', change: '+89', color: 'text-purple-500' },
    { label: 'Avg APY', value: '68.5%', change: '+4.2%', color: 'text-orange-500' }
  ];

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Funds</h1>
          <p className={`${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Discover and invest in automated DeFi strategies
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`p-4 rounded-xl border backdrop-blur-sm ${
            state.isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <p className={`text-xs ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              {stat.label}
            </p>
            <p className="text-lg font-bold mb-1">{stat.value}</p>
            <p className={`text-xs ${stat.color} flex items-center`}>
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Smart Funds Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Available Funds</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.smartFunds.map((fund) => (
            <SmartFundCard key={fund.id} fund={fund} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SmartFundList;