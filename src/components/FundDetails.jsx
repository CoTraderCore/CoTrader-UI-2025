// components/FundDetails.js
import React from 'react';
import { useDeFi } from '../context/DeFiContext';

const FundDetails = () => {
  const { state, dispatch } = useDeFi();
  const fund = state.selectedFund;

  if (!fund) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Fund not found</h1>
        <p>Please select a fund from the Smart Funds page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: 'funds' })}
          className={`p-2 rounded-lg ${state.isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
        >
          ←
        </button>
        <h1 className="text-3xl font-bold">{fund.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Fund Overview</h2>
            <p className={`mb-4 ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {fund.description}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manager</p>
                <p className="font-mono text-sm">{fund.manager}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inception Date</p>
                <p>{fund.inception}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Investors</p>
                <p>{fund.totalInvestors}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min Investment</p>
                <p>{fund.minimumInvestment}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Asset Allocation</h2>
            <div className="space-y-3">
              {fund.assets.map((asset, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{asset}</span>
                  <span className="font-mono">{Math.floor(Math.random() * 40 + 10)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value Locked</p>
                <p className="text-2xl font-bold text-green-500">{fund.tvl}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Annual Percentage Yield</p>
                <p className="text-2xl font-bold text-blue-500">{fund.apy}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Performance</p>
                <p className="text-xl font-bold text-green-500">{fund.performance}</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="space-y-3">
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200">
                Deposit
              </button>
              <button className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200">
                Withdraw
              </button>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                Claim Rewards
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetails;