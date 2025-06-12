// Deposit.js - Updated with modern dark/light theme styles
import React, { useState, useContext } from 'react';
import Web3Context from '../../../context/Web3Context';
import DepositETH from './DepositETH';
import DepositERC20 from './DepositERC20';

function Deposit({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h2>
          </div>
          <button 
            onClick={modalClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Terms List */}
          <div className="space-y-4">
            <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>I certify that I'm not a USA citizen or resident.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>I understand CoTrader technology is new and is not to be trusted.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>I understand that CoTrader aims to protect investors with technology regulation, that aims to prove fees, fair play, and past performance.</span>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>I understand I shouldn't deposit anything I can't afford to lose.</span>
              </li>
            </ol>
          </div>

          {/* Checkbox Agreement */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                onChange={toggleAgree}
                checked={agree}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                I agree to the above Terms and Conditions to use this product.
                By cancelling you will not gain access to the service.
              </span>
            </label>
          </div>

          {/* Deposit Component */}
          {agree && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              {["BASE", "ETH", "BNB", "MATIC"].includes(mainAsset) ? (
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