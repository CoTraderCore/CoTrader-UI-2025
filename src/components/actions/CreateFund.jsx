// components/CreateFund.js - Fixed wallet connection check
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, Plus, Minus, AlertCircle } from 'lucide-react';
import { useDeFi } from '../../context/DeFiContext';
import Web3Context from '../../context/Web3Context';
import { APIEnpoint, SmartFundRegistryABIV9, SmartFundRegistryADDRESS } from '../../config.js';
import setPending from '../../utils/setPending';
import axios from 'axios';

const ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const USD_ADDRESS = '0xe9e7cea3dedca5984780bafc599bd69add087d56';

const CreateFund = () => {
  const navigate = useNavigate();
  const { web3, accounts } = useContext(Web3Context);
  const { state, dispatch } = useDeFi();
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    fundName: '',
    percent: 20,
    fundAsset: 'BASE',
    tradeVerification: false
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fundName.trim()) {
      newErrors.fundName = 'Fund name is required';
    }
    
    if (formData.percent <= 0 || formData.percent > 30) {
      newErrors.percent = 'Percentage must be between 0.01% and 30%';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createNewFund = async () => {
    if (!validateForm()) return;
    
    if (!web3 || !accounts || !accounts[0]) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    
    try {
      const contract = new web3.eth.Contract(SmartFundRegistryABIV9, SmartFundRegistryADDRESS);
      const percentMultiplier = 100;
      const block = await web3.eth.getBlockNumber();
      const coreAsset = formData.fundAsset === 'BASE' ? ETH_ADDRESS : USD_ADDRESS;

      console.log('Creating fund:', {
        name: formData.fundName,
        percent: formData.percent,
        coreAsset,
        tradeVerification: formData.tradeVerification,
        fundAsset: formData.fundAsset
      });

      // Get current tx count
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      // Create fund
      await contract.methods
        .createSmartFund(
          formData.fundName, 
          formData.percent * percentMultiplier, 
          coreAsset, 
          formData.tradeVerification
        )
        .send({ 
          from: accounts[0], 
          gasPrice: await web3.eth.getGasPrice() 
        })
        .on('transactionHash', (hash) => {
          // Pending status for DB
          setPending(null, 1, accounts[0], block, hash, 'SmartFundCreated');
          dispatch({ type: 'SET_PENDING_TRANSACTIONS', payload: { status: true, count: txCount + 1 } });
        });

      // Reset form and navigate
      resetForm();
      navigate('/funds');
      
    } catch (error) {
      console.error('Error creating fund:', error);
      dispatch({ type: 'SET_PENDING_TRANSACTIONS', payload: { status: false, count: 0 } });
      alert('Transaction failed. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fundName: '',
      percent: 20,
      fundAsset: 'BASE',
      tradeVerification: false
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBack = () => {
    navigate('/funds');
  };

  const InfoTooltip = ({ text, children }) => (
    <div className="group relative">
      {children}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-64 ${
        state.isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
      }`}>
        {text}
        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 ${
          state.isDarkMode ? 'bg-gray-700' : 'bg-gray-800'
        } rotate-45`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Title */}
      <div className="space-y-2">
        <h1 className={`text-4xl font-bold ${
          state.isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Create New Fund</h1>
        <p className={`text-lg ${
          state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Set up your smart fund with multi-DEX support
        </p>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Fund Configuration</h2>

            <div className="space-y-6">
              {/* Fund Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Fund Name *
                </label>
                <input
                  type="text"
                  value={formData.fundName}
                  onChange={(e) => handleInputChange('fundName', e.target.value)}
                  placeholder="Enter fund name"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    errors.fundName
                      ? 'border-red-500 focus:border-red-500'
                      : state.isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                />
                {errors.fundName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.fundName}
                  </p>
                )}
              </div>

              {/* Performance Fee */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Performance Fee % *
                  </label>
                  <InfoTooltip text="This is the % the fund manager earns for the profits earned, relative to main fund asset (BASE, USD or COT).">
                    <Info className={`w-4 h-4 cursor-help ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </InfoTooltip>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center rounded-lg border ${
                    errors.percent
                      ? 'border-red-500'
                      : state.isDarkMode
                        ? 'border-gray-600'
                        : 'border-gray-300'
                  }`}>
                    <span className={`px-3 py-3 text-sm font-medium border-r ${
                      state.isDarkMode 
                        ? 'bg-gray-700 text-gray-300 border-gray-600' 
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}>
                      %
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      max="30"
                      step="0.01"
                      value={formData.percent}
                      onChange={(e) => handleInputChange('percent', parseFloat(e.target.value) || 0)}
                      className={`px-4 py-3 w-24 ${
                        state.isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-white text-gray-900'
                      } focus:outline-none`}
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleInputChange('percent', Math.max(0.01, formData.percent - 1))}
                      className={`p-2 rounded-lg transition-colors ${
                        state.isDarkMode
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('percent', Math.min(30, formData.percent + 1))}
                      className={`p-2 rounded-lg transition-colors ${
                        state.isDarkMode
                          ? 'hover:bg-gray-700 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {errors.percent && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.percent}
                  </p>
                )}
              </div>

              {/* Main Fund Asset */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Main Fund Asset *
                  </label>
                  <InfoTooltip text="With the help of this asset, investors will invest, calculate fund value etc">
                    <Info className={`w-4 h-4 cursor-help ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </InfoTooltip>
                </div>
                <select
                  value={formData.fundAsset}
                  onChange={(e) => handleInputChange('fundAsset', e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    state.isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                >
                  <option value="BASE">BASE</option>
                  <option value="USD">USD</option>
                </select>
              </div>

              {/* Trade Verification */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Security Options
                  </label>
                  <InfoTooltip text="This gives investors confidence that even if the trader's key is stolen, the worst a hacker can do is trade to legit tokens, not likely to a token just created by the trader to exit scam the fund, leaving it without value.">
                    <Info className={`w-4 h-4 cursor-help ${
                      state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  </InfoTooltip>
                </div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tradeVerification}
                    onChange={(e) => handleInputChange('tradeVerification', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm ${
                    state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Use trade verification (Limit tokens to verified list)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Summary and Actions */}
        <div className="space-y-6">
          {/* Fund Summary */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Fund Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Name:</span>
                <span className={`font-medium ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{formData.fundName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Performance Fee:</span>
                <span className={`font-medium ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{formData.percent}%</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Main Asset:</span>
                <span className={`font-medium ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{formData.fundAsset}</span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Trade Verification:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  formData.tradeVerification
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-gray-500/20 text-gray-500'
                }`}>
                  {formData.tradeVerification ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`p-6 rounded-2xl border ${
            state.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="space-y-3">
              {!web3 ? (
                <div className={`p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10`}>
                  <p className="text-yellow-500 text-sm">
                    Please connect your wallet to create a fund
                  </p>
                </div>
              ) : (
                <button
                  onClick={createNewFund}
                  disabled={isCreating}
                  className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
                    isCreating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  } text-white`}
                >
                  {isCreating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Fund...</span>
                    </div>
                  ) : (
                    'Create Fund'
                  )}
                </button>
              )}
              
              <button
                onClick={resetForm}
                className={`w-full px-6 py-3 rounded-lg font-medium border transition-colors ${
                  state.isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Reset Form
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateFund;