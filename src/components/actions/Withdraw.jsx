// Withdraw.js - Updated with Tailwind CSS and day/night theme
import React, { useState, useContext } from 'react';
import { IoRemove, IoClose, IoWarning } from 'react-icons/io5';
import axios from 'axios';
import { APIEnpoint, SmartFundABIV7 } from '../../config';
import setPending from '../../utils/setPending';
import Web3Context from '../../context/Web3Context';
import { useDeFi } from '../../context/DeFiContext';

function Withdraw({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [show, setShow] = useState(false);
  const [percent, setPercent] = useState(50);
  const [isConvert, setIsConvert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const modalClose = () => {
    setShow(false);
    setPercent(50);
    setIsConvert(false);
    setError('');
    setIsLoading(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      modalClose();
    }
  };

  const withdraw = async () => {
    if (percent < 1 || percent > 100) {
      setError('Percent must be between 1 and 100');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const contractABI = SmartFundABIV7;
      const contract = new web3.eth.Contract(contractABI, address);
      const shares = await contract?.methods.balanceOf(accounts[0]).call();

      if (shares <= 0) {
        setError('Empty deposit - no shares to withdraw');
        setIsLoading(false);
        return;
      }

      const totalPercentage = await contract.methods.TOTAL_PERCENTAGE().call();
      const currentPercent = (totalPercentage / 100) * percent;

      const block = await web3.eth.getBlockNumber();

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      const params = version === 6 ? [currentPercent, isConvert] : [currentPercent];

      modalClose();

      contract.methods
        .withdraw(...params)
        .send({ 
          from: accounts[0], 
          gasPrice: await web3.eth.getGasPrice() 
        })
        .on('transactionHash', (hash) => {
          pending(true, txCount + 1);
          setPending(address, 1, accounts[0], block, hash, "Withdraw");
          setIsLoading(false);
        })
        .on('error', (error) => {
          console.error('Transaction error:', error);
          setIsLoading(false);
        });

    } catch (error) {
      console.error('Withdraw error:', error);
      setError('Can not verify transaction data, please try again in a minute');
      setIsLoading(false);
    }
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        disabled={!web3}
        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
          web3
            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {!web3 ? "Connect Web3 to Withdraw" : "Withdraw"}
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className={`rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border ${
        state.isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <IoRemove className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Withdraw from Smart Fund
            </h2>
          </div>
          <button 
            onClick={modalClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              state.isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Percentage Slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Withdrawal Percentage
              </label>
              <span className={`text-sm px-3 py-1.5 rounded-lg border ${
                state.isDarkMode 
                  ? 'border-gray-600 bg-gray-700 text-gray-300' 
                  : 'border-gray-300 bg-gray-50 text-gray-700'
              }`}>
                {percent}%
              </span>
            </div>
            
            <div className="relative">
              <input
                type="range"
                min="1"
                max="100"
                value={percent}
                onChange={(e) => setPercent(parseInt(e.target.value))}
                className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                  state.isDarkMode 
                    ? 'bg-gray-700 slider-thumb-dark' 
                    : 'bg-gray-200 slider-thumb-light'
                }`}
                style={{
                  background: `linear-gradient(to right, ${
                    state.isDarkMode ? '#ef4444' : '#dc2626'
                  } 0%, ${
                    state.isDarkMode ? '#ef4444' : '#dc2626'
                  } ${percent}%, ${
                    state.isDarkMode ? '#374151' : '#e5e7eb'
                  } ${percent}%, ${
                    state.isDarkMode ? '#374151' : '#e5e7eb'
                  } 100%)`
                }}
              />
              <div className="flex justify-between text-xs mt-2">
                <span className={state.isDarkMode ? 'text-gray-500' : 'text-gray-400'}>1%</span>
                <span className={state.isDarkMode ? 'text-gray-500' : 'text-gray-400'}>100%</span>
              </div>
            </div>

            {/* Quick percentage buttons */}
            <div className="flex space-x-2 mt-4">
              {[25, 50, 75, 100].map((quickPercent) => (
                <button
                  key={quickPercent}
                  onClick={() => setPercent(quickPercent)}
                  className={`flex-1 py-2 text-xs rounded-lg transition-all duration-200 ${
                    percent === quickPercent
                      ? 'bg-red-500 text-white'
                      : state.isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {quickPercent}%
                </button>
              ))}
            </div>
          </div>

          {/* Convert Assets Option (for version 6) */}
          {version === 6 && (
            <div className={`rounded-xl p-4 ${
              state.isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConvert}
                  onChange={() => setIsConvert(!isConvert)}
                  className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className={`text-sm leading-relaxed ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Try convert assets to {mainAsset}
                </span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              state.isDarkMode 
                ? 'bg-red-900/20 border-red-800' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <IoWarning className="w-4 h-4 text-red-500" />
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Withdraw Button */}
          <button
            onClick={withdraw}
            disabled={isLoading || percent < 1 || percent > 100}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-4 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <IoRemove className="w-5 h-5" />
                <span>Withdraw {percent}%</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

export default Withdraw;