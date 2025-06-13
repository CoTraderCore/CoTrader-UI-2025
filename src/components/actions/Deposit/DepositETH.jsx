// DepositETH.js - Updated with Tailwind CSS and day/night theme
import React, { useState, useEffect, useContext } from 'react';
import { IoAdd, IoWarning } from 'react-icons/io5';
import { fromWei, toWei } from 'web3-utils';
import axios from 'axios';
import { APIEnpoint, SmartFundABI } from '../../../config.js';
import setPending from '../../../utils/setPending.js';
import Web3Context from '../../../context/Web3Context';
import { useDeFi } from '../../../context/DeFiContext';

function DepositETH({ mainAsset, address, pending, modalClose }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [depositValue, setDepositValue] = useState('');
  const [valueError, setValueError] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getBalance = async () => {
      if (web3 && accounts && accounts[0]) {
        try {
          const ethBalanceInWei = await web3.eth.getBalance(accounts[0]);
          const ethBalance = fromWei(ethBalanceInWei, 'ether');
          setEthBalance(parseFloat(ethBalance).toFixed(4));
        } catch (error) {
          console.error('Error getting balance:', error);
        }
      }
    };

    getBalance();
  }, [web3, accounts]);

  const validation = async () => {
    console.log("Validation called with depositValue:", depositValue);
    setValueError('');
    setIsLoading(true);

    if (!depositValue || parseFloat(depositValue) <= 0) {
      setValueError("Value must be greater than 0");
      setIsLoading(false);
      return;
    }

    try {
      const userBalance = await web3.eth.getBalance(accounts[0]);
      const weiBalance = web3.utils.fromWei(userBalance.toString(), 'ether')
      if (Number(depositValue) > Number(weiBalance)) {
        setValueError(`Not enough ${mainAsset}`);
        setIsLoading(false);
        return;
      }

      await depositETH();
    } catch (error) {
      console.error('Validation error:', error);
      setValueError('Error validating transaction');
      setIsLoading(false);
    }
  };

  const depositETH = async () => {
    console.log("DepositETH called with address:", address)
    try {
      const fundETH = new web3.eth.Contract(SmartFundABI, address);
      console.log("depositValue",depositValue)
      const amount = toWei(depositValue.toString(), 'ether');

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      let block = await web3.eth.getBlockNumber();

      modalClose();

      fundETH.methods.deposit().send({ 
        from: accounts[0], 
        value: amount 
      })
      .on('transactionHash', (hash) => {
        pending(true, txCount + 1);
        setPending(address, 1, accounts[0], block, hash, "Deposit");
        setIsLoading(false);
      })
      .on('error', (error) => {
        console.error('Transaction error:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Deposit error:', error);
      alert("Can not verify transaction data, please try again in a minute");
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    // Leave a small amount for gas fees
    const maxAmount = Math.max(0, parseFloat(ethBalance) - 0.01);
    setDepositValue(maxAmount.toFixed(4));
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={`text-sm font-medium ${
            state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Enter {mainAsset}
          </label>
          <button
            onClick={handleMaxClick}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 font-medium"
          >
            Balance: {ethBalance}
          </button>
        </div>
        
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.001"
            placeholder="0.0"
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            className={`w-full px-4 py-4 text-lg border rounded-xl transition-all duration-200 pr-20 ${
              state.isDarkMode 
                ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }`}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <span className={`text-sm font-medium px-2 py-1 rounded-md ${
              state.isDarkMode 
                ? 'bg-gray-600 text-gray-400' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              {mainAsset}
            </span>
          </div>
        </div>
        
        {valueError && (
          <div className={`mt-2 p-3 rounded-lg border ${
            state.isDarkMode 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <IoWarning className="w-4 h-4 text-red-500" />
              <span className={`text-sm ${
                state.isDarkMode ? 'text-red-400' : 'text-red-700'
              }`}>
                {valueError}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={validation}
        disabled={isLoading || !depositValue || parseFloat(depositValue) <= 0}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
            <IoAdd className="w-5 h-5" />
            <span>Deposit {mainAsset}</span>
          </>
        )}
      </button>
    </div>
  );
}

export default DepositETH;