// Deposit.js - Updated with Tailwind CSS and day/night theme
import React, { useState, useContext } from 'react';
import { IoCheckmark, IoClose } from 'react-icons/io5';
import Web3Context from '../../../context/Web3Context';
import { useDeFi } from '../../../context/DeFiContext';
import DepositETH from './DepositETH';
import DepositERC20 from './DepositERC20';
import { SupportedAssets } from '../../../config';

function Deposit({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);

  const modalClose = () => {
    setShow(false);
    setAgree(false);
  };

  const toggleAgree = () => {
    setAgree(!agree);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      modalClose();
    }
  };

  const termsData = [
    {
      number: 1,
      text: "I certify that I'm not a USA citizen or resident.",
      color: 'red'
    },
    {
      number: 2,
      text: "I understand CoTrader technology is new and is not to be trusted.",
      color: 'orange'
    },
    {
      number: 3,
      text: "I understand that CoTrader aims to protect investors with technology regulation, that aims to prove fees, fair play, and past performance.",
      color: 'blue'
    },
    {
      number: 4,
      text: "I understand I shouldn't deposit anything I can't afford to lose.",
      color: 'yellow'
    }
  ];

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
        {!web3 ? "Connect Web3 to Deposit" : "Deposit"}
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
              <IoCheckmark className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Terms and Conditions
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
          {/* Terms List */}
          <div className="space-y-4">
            <ol className="space-y-3 text-sm">
              {termsData.map((term, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    term.color === 'red' ? 
                      (state.isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600') :
                    term.color === 'orange' ? 
                      (state.isDarkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600') :
                    term.color === 'blue' ? 
                      (state.isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') :
                      (state.isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
                  }`}>
                    {term.number}
                  </span>
                  <span className={state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {term.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Checkbox Agreement */}
          <div className={`rounded-xl p-4 ${
            state.isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                onChange={toggleAgree}
                checked={agree}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className={`text-sm leading-relaxed ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                I agree to the above Terms and Conditions to use this product.
                By cancelling you will not gain access to the service.
              </span>
            </label>
          </div>

          {/* Deposit Component */}
          {agree && (
            <div className={`border-t pt-6 ${
              state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {SupportedAssets.includes(mainAsset) ? (
                <DepositETH
                  mainAsset={mainAsset}
                  address={address}
                  pending={pending}
                  modalClose={modalClose}
                />
              ) : (
                <DepositERC20
                  mainAsset={mainAsset}
                  address={address}
                  pending={pending}
                  modalClose={modalClose}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Deposit;