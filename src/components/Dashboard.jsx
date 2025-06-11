// components/Dashboard.js
import React from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import { mockTransactions } from '../context/DeFiContext';

const Dashboard = () => {
  const { state } = useDeFi();
  
  const stats = [
    { label: 'Total TVL', value: '$16.2M', change: '+12.5%', color: 'text-green-500' },
    { label: 'Active Funds', value: '24', change: '+3', color: 'text-blue-500' },
    { label: 'Total Users', value: '1,247', change: '+89', color: 'text-purple-500' },
    { label: 'Avg APY', value: '68.5%', change: '+4.2%', color: 'text-orange-500' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className={`${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Welcome to your DeFi analytics hub
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {stat.label}
            </p>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            <p className={`text-sm ${stat.color} flex items-center`}>
              <ArrowUpRight className="w-4 h-4 mr-1" />
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-2xl border ${
        state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {mockTransactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex justify-between items-center p-3 rounded-lg bg-opacity-50 bg-gray-500">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'Deposit' ? 'bg-green-500/20 text-green-500' :
                  tx.type === 'Withdraw' ? 'bg-red-500/20 text-red-500' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  {tx.type === 'Deposit' ? <ArrowDownRight className="w-4 h-4" /> :
                   tx.type === 'Withdraw' ? <ArrowUpRight className="w-4 h-4" /> :
                   <DollarSign className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {tx.timestamp}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{tx.amount}</p>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tx.usdValue}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;