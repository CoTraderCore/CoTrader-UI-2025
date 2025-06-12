// components/FundDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import Deposit from './actions/Deposit/Deposit';

const FundDetails = () => {
  const { fundAddress } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useDeFi();
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const pendingHandler = () => {
    alert("TODO show effect")
  };

  useEffect(() => {
    // Find the fund by address from the smart funds data
    if (state.smartFunds && state.smartFunds.length > 0 && fundAddress) {
      const foundFund = state.smartFunds.find(f => 
        f.address.toLowerCase() === fundAddress.toLowerCase()
      );
      
      if (foundFund) {
        setFund(foundFund);
        dispatch({ type: 'SET_SELECTED_FUND', payload: foundFund });
      } else {
        setFund(null);
      }
    }
    setLoading(false);
  }, [state.smartFunds, fundAddress, dispatch]);

  const handleBack = () => {
    navigate('/funds');
  };

  const copyAddress = async () => {
    if (fund?.address) {
      try {
        await navigator.clipboard.writeText(fund.address);
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (err) {
        console.error('Failed to copy address:', err);
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
              state.isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Funds</span>
          </button>
        </div>
        
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Fund Not Found</h1>
          <p className={`text-lg mb-6 ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The fund with address <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{fundAddress}</code> could not be found.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View All Funds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
              state.isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Funds</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(fund.risk)}`}>
            {fund.risk || 'Unknown'} Risk
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            state.isDarkMode 
              ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {fund.category || fund.fundType || 'General'}
          </span>
        </div>
      </div>

      {/* Fund Title and Address */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{fund.name}</h1>
        <div className="flex items-center space-x-3">
          <span className={`font-mono text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {formatAddress(fund.address)}
          </span>
          <button
            onClick={copyAddress}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              copiedAddress
                ? 'text-green-500'
                : state.isDarkMode 
                  ? 'text-gray-400 hover:text-gray-300' 
                  : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {copiedAddress ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copiedAddress ? 'Copied!' : 'Copy'}</span>
          </button>
          <a
            href={`https://polygonscan.com/address/${fund.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              state.isDarkMode 
                ? 'text-gray-400 hover:text-gray-300' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ExternalLink className="w-3 h-3" />
            <span>View on PolygonScan</span>
          </a>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fund Overview */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Fund Overview</h2>
            <p className={`mb-6 ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {fund.description}
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Manager</p>
                <p className="font-mono text-sm">{formatAddress(fund.manager || fund.owner)}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Inception Date</p>
                <p>{fund.inception}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Investors</p>
                <p>{fund.totalInvestors || 0}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Min Investment</p>
                <p>{fund.minimumInvestment}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Manager Fee</p>
                <p>{fund.managerFee ? `${(fund.managerFee / 100).toFixed(2)}%` : 'N/A'}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Main Asset</p>
                <p>{fund.mainAsset || 'MATIC'}</p>
              </div>
            </div>
          </div>

          {/* Asset Allocation */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Asset Allocation</h2>
            <div className="space-y-3">
              {(fund.assets || ['ETH']).map((asset, index) => {
                const percentage = Math.floor(Math.random() * 40 + 10); // Mock percentage
                return (
                  <div key={index} className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        index % 4 === 0 ? 'from-blue-500 to-blue-600' :
                        index % 4 === 1 ? 'from-green-500 to-green-600' :
                        index % 4 === 2 ? 'from-purple-500 to-purple-600' :
                        'from-orange-500 to-orange-600'
                      }`} />
                      <span className="font-medium">{asset}</span>
                    </div>
                    <span className="font-mono font-medium">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Data */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Financial Data</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Value in MATIC</p>
                <p className="text-lg font-bold">{fund.valueInETH || '0'} MATIC</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Value in USD</p>
                <p className="text-lg font-bold">${fund.valueInUSD || '0'}</p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Profit in MATIC</p>
                <p className={`text-lg font-bold ${parseFloat(fund.profitInETH || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {fund.profitInETH || '0'} MATIC
                </p>
              </div>
              <div>
                <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Profit in USD</p>
                <p className={`text-lg font-bold ${parseFloat(fund.profitInUSD || '0') >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${fund.profitInUSD || '0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Key Metrics and Actions */}
        <div className="space-y-6">
          {/* Key Metrics */}
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
                <p className={`text-xl font-bold ${
                  fund.performance?.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}>
                  {fund.performance}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="space-y-3">
             <Deposit 
                address={fund.address}
                mainAsset={fund.mainAsset || 'ETH'}
                version={fund.version || 1}
                pending={pendingHandler}
               />
              <button className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                Withdraw
              </button>
            </div>
          </div>

          {/* Fund Status */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className="text-xl font-bold mb-4">Fund Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Version</span>
                <span className="font-medium">v{fund.version || 1}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Trade Verification</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  fund.tradeVerification 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  {fund.tradeVerification ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetails;