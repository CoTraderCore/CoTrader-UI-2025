// DepositERC20.js - Updated with modern dark/light theme styles
import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { APIEnpoint, SmartFundABIV7, ERC20ABI } from '../../../config.js';
import setPending from '../../../utils/setPending.js';
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../../utils/weiByDecimals';
import Web3Context from '../../../context/Web3Context';

function DepositERC20({ mainAsset, address, pending, modalClose }) {
  const { web3, accounts } = useContext(Web3Context);
  const [depositValue, setDepositValue] = useState('');
  const [valueError, setValueError] = useState('');
  const [ercAssetAddress, setErcAssetAddress] = useState(null);
  const [ercAssetContract, setErcAssetContract] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [approvePending, setApprovePending] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  const updateAllowance = useCallback(async () => {
    if (!ercAssetContract || !accounts || !accounts[0] || !depositValue) return false;

    try {
      const allowance = await ercAssetContract.methods.allowance(
        accounts[0],
        address
      ).call();

      const decimals = await ercAssetContract.methods.decimals().call();
      const allowanceFromWei = fromWeiByDecimalsInput(decimals, allowance);

      const approved = Number(allowanceFromWei) >= Number(depositValue);
      setIsApproved(approved);
      return approved;
    } catch (error) {
      console.error('Error updating allowance:', error);
      return false;
    }
  }, [ercAssetContract, accounts, address, depositValue]);

  useEffect(() => {
    const initializeContract = async () => {
      if (!web3 || !accounts || !accounts[0]) return;

      try {
        const fund = new web3.eth.Contract(SmartFundABIV7, address);
        const assetAddress = await fund.methods.coreFundAsset().call();
        const assetContract = new web3.eth.Contract(ERC20ABI, assetAddress);
        const tokenSymbol = await assetContract.methods.symbol().call();
        const decimals = await assetContract.methods.decimals().call();
        const balanceInWei = await assetContract.methods.balanceOf(accounts[0]).call();
        const balance = fromWeiByDecimalsInput(BigNumber(decimals), balanceInWei);

        setErcAssetAddress(assetAddress);
        setErcAssetContract(assetContract);
        setSymbol(tokenSymbol);
        setTokenBalance(parseFloat(balance).toFixed(4));
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initializeContract();
  }, [web3, accounts, address]);

  useEffect(() => {
    if (depositValue && parseFloat(depositValue) > 0) {
      updateAllowance();
    }
  }, [depositValue, updateAllowance]);

  const checkAllowanceInterval = () => {
    const timerId = setInterval(async () => {
      const approved = await updateAllowance();
      if (approved) {
        clearInterval(timerId);
        setApprovePending(false);
      }
    }, 3000);
  };

  const validation = async () => {
    setValueError('');
    setIsLoading(true);

    if (!depositValue || parseFloat(depositValue) <= 0) {
      setValueError("Value must be greater than 0");
      setIsLoading(false);
      return;
    }

    try {
      const ercAssetDecimals = await ercAssetContract.methods.decimals().call();
      const userWalletBalance = await ercAssetContract.methods.balanceOf(accounts[0]).call();
      const userBalanceFromWei = fromWeiByDecimalsInput(ercAssetDecimals, userWalletBalance);

      if (parseFloat(depositValue) > parseFloat(userBalanceFromWei)) {
        setValueError(`Not enough ${symbol}`);
        setIsLoading(false);
        return;
      }

      await depositERC20();
    } catch (error) {
      console.error('Validation error:', error);
      setValueError('Error validating transaction');
      setIsLoading(false);
    }
  };

  const unlockERC20 = async () => {
    setIsLoading(true);
    try {
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      let block = await web3.eth.getBlockNumber();

      ercAssetContract.methods.approve(
        address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      )
      .send({ from: accounts[0] })
      .on('transactionHash', (hash) => {
        pending(true, txCount + 1);
        setPending(address, 1, accounts[0], block, hash, "Approve");
        checkAllowanceInterval();
        setApprovePending(true);
        setIsLoading(false);
      })
      .on('error', (error) => {
        console.error('Approve error:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Unlock error:', error);
      alert("Can not verify transaction data, please try again in a minute");
      setIsLoading(false);
    }
  };

  const depositERC20 = async () => {
    try {
      const ercAssetDecimals = await ercAssetContract.methods.decimals().call();
      const amount = toWeiByDecimalsInput(ercAssetDecimals, depositValue);

      const fundERC20 = new web3.eth.Contract(SmartFundABIV7, address);

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      let block = await web3.eth.getBlockNumber();

      modalClose();

      fundERC20.methods.deposit(amount)
      .send({ from: accounts[0] })
      .on('transactionHash', (hash) => {
        pending(true, txCount + 1);
        setPending(address, 1, accounts[0], block, hash, "Deposit");
        setIsLoading(false);
      })
      .on('error', (error) => {
        console.error('Deposit error:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Deposit error:', error);
      alert("Can not verify transaction data, please try again in a minute");
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    setDepositValue(tokenBalance);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter {symbol || 'Token'}
          </label>
          <button
            onClick={handleMaxClick}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-200 font-medium"
          >
            Balance: {tokenBalance}
          </button>
        </div>
        
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.000001"
            placeholder="0.0"
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            className="w-full px-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md">
              {symbol || 'TOKEN'}
            </span>
          </div>
        </div>
        
        {valueError && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-400">{valueError}</span>
            </div>
          </div>
        )}
      </div>

      {!isApproved ? (
        <div className="space-y-3">
          <button
            onClick={unlockERC20}
            disabled={isLoading || approvePending}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Unlock {symbol || 'Token'}</span>
              </>
            )}
          </button>
          
          {approvePending && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Waiting for approval confirmation...
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Deposit {symbol || 'Token'}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default DepositERC20;