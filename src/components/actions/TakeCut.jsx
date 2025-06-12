// TakeCut.js - Tailwind CSS version with day/night theme
import React, { useState, useEffect, useContext } from 'react';
import { IoWallet, IoClose, IoWarning } from 'react-icons/io5';
import axios from 'axios';
import { APIEnpoint, SmartFundABIV7 } from '../../config';
import setPending from '../../utils/setPending';
import Web3Context from '../../context/Web3Context';
import { useDeFi } from '../../context/DeFiContext';
import { fromWei } from 'web3-utils';

function TakeCut({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [show, setShow] = useState(false);
  const [isConvert, setIsConvert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [managerCut, setManagerCut] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!web3 || !address) return;
      
      try {
        const contract = new web3.eth.Contract(SmartFundABIV7, address);
        let cutValue;
        
        try {
          const { fundManagerRemainingCut } = await contract.methods.calculateFundManagerCut().call();
          cutValue = parseFloat(fromWei(String(fundManagerRemainingCut)));
        } catch (e) {
          cutValue = 0;
        }
        
        if (isMounted) {
          setManagerCut(cutValue);
        }
      } catch (error) {
        console.error('Error fetching manager cut:', error);
        if (isMounted) {
          setManagerCut(0);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [web3, address]);

  const modalClose = () => {
    setShow(false);
    setIsConvert(false);
    setError('');
    setIsLoading(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      modalClose();
    }
  };

  const takeCut = async () => {
    setError('');
    setIsLoading(true);

    try {
      const contractABI = SmartFundABIV7;
      const contract = new web3.eth.Contract(contractABI, address);
      const block = await web3.eth.getBlockNumber();

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      modalClose();

      contract.methods
        .fundManagerWithdraw()
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
      console.error('Take cut error:', error);
      setError('Can not verify transaction data, please try again in a minute');
      setIsLoading(false);
    }
  };

  const canTakeCut = parseFloat(managerCut) > 0 || version > 7;

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        disabled={!web3}
        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
          web3
            ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {!web3 ? "Connect Web3 to Take Cut" : "Take Cut"}
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <IoWallet className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Take Cut from Smart Fund
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
          {/* Manager Cut Information */}
          <div className={`rounded-xl p-4 ${
            state.isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            {version === 8 ? (
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Update Required
                </h3>
                <p className={`text-sm ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Please update fund value
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-2 ${
                  state.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Current Manager Cut
                </h3>
                <div className={`text-2xl font-bold ${
                  parseFloat(managerCut) > 0 
                    ? 'text-green-500' 
                    : state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {managerCut.toFixed(6)} ETH
                </div>
                {parseFloat(managerCut) === 0 && (
                  <p className={`text-sm mt-1 ${
                    state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No cut available to withdraw
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Convert Assets Option (for version 6) */}
          {version === 6 && canTakeCut && (
            <div className={`rounded-xl p-4 ${
              state.isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
            }`}>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConvert}
                  onChange={() => setIsConvert(!isConvert)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
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

          {/* Take Cut Button */}
          {canTakeCut ? (
            <button
              onClick={takeCut}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
                  <IoWallet className="w-5 h-5" />
                  <span>Take Cut</span>
                </>
              )}
            </button>
          ) : (
            <div className={`text-center py-4 ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <p className="text-sm">No cut available to withdraw at this time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TakeCut;