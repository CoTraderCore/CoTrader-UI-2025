// Trade.js - Trading component with Tailwind CSS and day/night theme
import React, { useState, useContext, useEffect } from 'react';
import { TrendingUp, ArrowUpDown, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { APIEnpoint, SmartFundABIV7, ERC20ABI, UNIRouterABI, QuickSwapRouter, WETH } from '../../config';
import setPending from '../../utils/setPending';
import Web3Context from '../../context/Web3Context';
import { useDeFi } from '../../context/DeFiContext';
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals';
import tokensList from '../../storage/tokens/tokensList';
import BigNumber from 'bignumber.js';

function Trade({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [show, setShow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Trade state
  const [fromToken, setFromToken] = useState('BASE');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [tokens, setTokens] = useState(null);
  const [symbols, setSymbols] = useState(null);
  const [slippage, setSlippage] = useState(5);
  const [isCalculating, setIsCalculating] = useState(false);

  // Check if current user is the fund manager
  const isManager = state.account && address && 
    state.account.toLowerCase() === state.selectedFund?.manager?.toLowerCase();

  useEffect(() => {
    if (show) {
      initTokenData();
    }
  }, [show]);

  const initTokenData = async () => {
    let tokenList = [
      { symbol: "BASE", address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    ];
    let symbolList = ['BASE'];

    try {
      for (const [, value] of Object.entries(tokensList)) {
        symbolList.push(value.symbol);
        tokenList.push({
          symbol: value.symbol,
          address: value.address,
          decimals: value.decimals,
        });
      }
    } catch (e) {
      console.log("Error loading tokens:", e);
    }

    setTokens(tokenList);
    setSymbols(symbolList);
  };

  const modalClose = () => {
    setShow(false);
    setFromToken('BASE');
    setToToken('USDC');
    setFromAmount('');
    setToAmount('');
    setError('');
    setIsLoading(false);
    setSlippage(5);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      modalClose();
    }
  };

  const getTokenData = (symbol) => {
    return tokens?.find(token => token.symbol === symbol);
  };

  const getRate = async (from, to, amount, decimalsFrom, decimalsTo) => {
    let price = 0;

    if (amount > 0 && from !== to) {
      try {
        const src = toWeiByDecimalsInput(decimalsFrom, amount.toString());
        const _from = String(from).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? WETH : from;
        const _to = String(to).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? WETH : to;

        const router = new web3.eth.Contract(UNIRouterABI, QuickSwapRouter);
        const data = await router.methods.getAmountsOut(src, [_from, _to]).call();
        price = data[1];
      } catch (e) {
        console.log("Rate error:", e);
      }
    }

    return price;
  };

  const updateToAmount = async (amount) => {
    if (!amount || !tokens) return;

    setIsCalculating(true);
    const fromTokenData = getTokenData(fromToken);
    const toTokenData = getTokenData(toToken);

    if (fromTokenData && toTokenData) {
      try {
        const rate = await getRate(
          fromTokenData.address,
          toTokenData.address,
          amount,
          fromTokenData.decimals,
          toTokenData.decimals
        );

        if (rate) {
          const result = fromWeiByDecimalsInput(toTokenData.decimals, rate);
          setToAmount(result);
        }
      } catch (e) {
        console.log("Update amount error:", e);
      }
    }
    setIsCalculating(false);
  };

  const checkFundBalance = async () => {
    const fromTokenData = getTokenData(fromToken);
    if (!fromTokenData) return false;

    let fundBalance;
    
    if (fromTokenData.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
      fundBalance = await web3.eth.getBalance(address);
      fundBalance = web3.utils.fromWei(fundBalance);
    } else {
      const ERC20 = new web3.eth.Contract(ERC20ABI, fromTokenData.address);
      fundBalance = await ERC20.methods.balanceOf(address).call();
      fundBalance = fromWeiByDecimalsInput(fromTokenData.decimals, fundBalance);
    }

    return parseFloat(fundBalance) >= parseFloat(fromAmount);
  };

  const executeTrade = async () => {
    if (!isManager) {
      setError('Only the fund manager can execute trades');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (fromToken === toToken) {
      setError('From and To tokens cannot be the same');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const hasBalance = await checkFundBalance();
      if (!hasBalance) {
        setError(`Insufficient ${fromToken} balance in fund`);
        setIsLoading(false);
        return;
      }

      const smartFund = new web3.eth.Contract(SmartFundABIV7, address);
      const block = await web3.eth.getBlockNumber();

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      const fromTokenData = getTokenData(fromToken);
      const toTokenData = getTokenData(toToken);
      
      const amountInWei = toWeiByDecimalsInput(fromTokenData.decimals, fromAmount);
      
      // Calculate minimum return with slippage
      const toAmountWei = toWeiByDecimalsInput(toTokenData.decimals, toAmount);
      const minReturn = new BigNumber(toAmountWei).multipliedBy(100 - slippage).dividedBy(100).toString();

      modalClose();

      // Execute trade
      smartFund.methods
        .trade(
          fromTokenData.address,
          amountInWei,
          toTokenData.address,
          4, // QuickSwap exchange type
          [], // proof (empty for now)
          [], // positions (empty for now)
          "0x", // additional data
          minReturn
        )
        .send({ 
          from: accounts[0], 
          gasPrice: await web3.eth.getGasPrice() 
        })
        .on('transactionHash', (hash) => {
          pending(true, txCount + 1);
          setPending(address, 1, accounts[0], block, hash, "Trade");
          setIsLoading(false);
        })
        .on('error', (error) => {
          console.error('Trade error:', error);
          setIsLoading(false);
        });

    } catch (error) {
      console.error('Trade execution error:', error);
      setError('Cannot verify transaction data, please try again');
      setIsLoading(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        disabled={!web3}
        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl ${
          web3
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        {!web3 ? "Connect Web3 to Trade" : "Trade"}
      </button>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
    >
      <div className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-auto shadow-2xl border ${
        state.isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          state.isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${
              state.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Trade Assets
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
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Manager Warning */}
          {!isManager && (
            <div className={`p-4 rounded-lg border ${
              state.isDarkMode 
                ? 'bg-yellow-900/30 border-yellow-700/50' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className={`text-sm font-medium ${
                    state.isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                  }`}>
                    Manager Only
                  </p>
                  <p className={`text-xs ${
                    state.isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                  }`}>
                    Only the fund manager can execute trades. You can view the trading interface but cannot submit transactions.
                  </p>
                </div>
              </div>
            </div>
          )}



          {/* From Token */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              From
            </label>
            <div className="flex space-x-2">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className={`flex-1 p-3 border rounded-lg ${
                  state.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {symbols?.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  updateToAmount(e.target.value);
                }}
                placeholder="0.0"
                className={`flex-1 p-3 border rounded-lg ${
                  state.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center">
            <button
              onClick={switchTokens}
              className={`p-2 rounded-full border-2 transition-colors ${
                state.isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* To Token */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              To
            </label>
            <div className="flex space-x-2">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className={`flex-1 p-3 border rounded-lg ${
                  state.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {symbols?.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
              <input
                type="number"
                value={toAmount}
                onChange={(e) => setToAmount(e.target.value)}
                placeholder="0.0"
                className={`flex-1 p-3 border rounded-lg ${
                  state.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } ${isCalculating ? 'opacity-50' : ''}`}
                readOnly
              />
            </div>
          </div>

          {/* Slippage */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Slippage Tolerance: {slippage}%
            </label>
            <div className="flex space-x-2">
              {[1, 3, 5, 10].map(value => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    slippage === value
                      ? 'bg-blue-500 text-white'
                      : state.isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                className={`px-3 py-2 text-sm border rounded-lg w-20 ${
                  state.isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                min="0"
                max="50"
                step="0.1"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg border ${
              state.isDarkMode 
                ? 'bg-red-900/20 border-red-800' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className={`text-sm ${
                  state.isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Trade Button */}
          <button
            onClick={executeTrade}
            disabled={isLoading || !isManager || !fromAmount || !toAmount}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
                <TrendingUp className="w-5 h-5" />
                <span>{isManager ? `Trade ${fromToken} for ${toToken}` : 'Manager Access Required'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Trade;