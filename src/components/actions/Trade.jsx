// Trade.js - Trading component with Tailwind CSS and day/night theme
import React, { useState, useContext, useEffect } from 'react';
import { TrendingUp, ArrowUpDown, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { 
  APIEnpoint, 
  SmartFundABIV7, 
  ERC20ABI, 
  UNIRouterABI, 
  UniV2Router, 
  WETH,
  NeworkID,
  MainAssetName,
  UNI_V2_DEX_TYPE
} from '../../config';
import setPending from '../../utils/setPending';
import Web3Context from '../../context/Web3Context';
import { useDeFi } from '../../context/DeFiContext';
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../utils/weiByDecimals';
import tokensList from '../../storage/tokens/tokensList';
import BigNumber from 'bignumber.js';
import getMerkleTreeData from '../../utils/getMerkleTreeData'

function Trade({ address, mainAsset, version, pending }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [show, setShow] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Trade state
  const [fromToken, setFromToken] = useState(MainAssetName);
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [tokens, setTokens] = useState(null);
  const [symbols, setSymbols] = useState(null);
  const [slippage, setSlippage] = useState(5);
  const [isCalculating, setIsCalculating] = useState(false);

  // Custom token import state
  const [showCustomToken, setShowCustomToken] = useState(false);
  const [customTokenAddress, setCustomTokenAddress] = useState('');
  const [customTokenSymbol, setCustomTokenSymbol] = useState('');
  const [customTokenDecimals, setCustomTokenDecimals] = useState('');
  const [isLoadingCustomToken, setIsLoadingCustomToken] = useState(false);
  const [customTokenError, setCustomTokenError] = useState('');

  // Token search state
  const [fromTokenSearch, setFromTokenSearch] = useState('');
  const [toTokenSearch, setToTokenSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check if current user is the fund manager
  const isManager = state.account && address && 
    state.account.toLowerCase() === state.selectedFund?.manager?.toLowerCase();

  useEffect(() => {
    if (show) {
      initTokenData();
    }
  }, [show]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount && tokens) {
      updateToAmount(fromAmount);
    }
  }, [fromToken, toToken]);

  const initTokenData = async () => {
    let tokenList = [
      { symbol: MainAssetName, address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", decimals: 18 },
    ];
    let symbolList = [MainAssetName];

    try {
      for (const [, value] of Object.entries(tokensList(NeworkID))) {
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
    setFromToken(MainAssetName);
    setToToken('USDC');
    setFromAmount('');
    setToAmount('');
    setError('');
    setIsLoading(false);
    setSlippage(5);
    setIsCalculating(false);
    setShowCustomToken(false);
    setCustomTokenAddress('');
    setCustomTokenSymbol('');
    setCustomTokenDecimals('');
    setCustomTokenError('');
    setFromTokenSearch('');
    setToTokenSearch('');
    setShowFromDropdown(false);
    setShowToDropdown(false);
    setSearchResults([]);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      modalClose();
    }
  };

  const getTokenData = (symbol) => {
    return tokens?.find(token => token.symbol === symbol);
  };

  const fetchTokenMetadata = async (tokenAddress) => {
    try {
      if (!web3.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
      
      const [symbol, decimals] = await Promise.all([
        tokenContract.methods.symbol().call(),
        tokenContract.methods.decimals().call()
      ]);

      return {
        symbol: symbol,
        decimals: parseInt(decimals),
        address: tokenAddress.toLowerCase()
      };
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw error;
    }
  };

  const addCustomToken = async () => {
    if (!customTokenAddress.trim()) {
      setCustomTokenError('Please enter a token address');
      return;
    }

    setIsLoadingCustomToken(true);
    setCustomTokenError('');

    try {
      const tokenData = await fetchTokenMetadata(customTokenAddress.trim());
      
      // Check if token already exists
      const existingToken = tokens?.find(token => 
        token.address.toLowerCase() === tokenData.address.toLowerCase()
      );

      if (existingToken) {
        setCustomTokenError('Token already exists in the list');
        setIsLoadingCustomToken(false);
        return;
      }

      // Add custom token to the list
      const newToken = {
        symbol: tokenData.symbol,
        address: tokenData.address,
        decimals: tokenData.decimals,
        isCustom: true
      };

      setTokens(prevTokens => [...prevTokens, newToken]);
      setSymbols(prevSymbols => [...prevSymbols, tokenData.symbol]);

      // Reset custom token form
      setCustomTokenAddress('');
      setCustomTokenSymbol('');
      setCustomTokenDecimals('');
      setShowCustomToken(false);
      
      // Optionally set as selected token
      setFromToken(tokenData.symbol);

    } catch (error) {
      console.error('Error adding custom token:', error);
      setCustomTokenError(
        error.message.includes('Invalid token address') 
          ? 'Invalid token address' 
          : 'Failed to load token data. Please check the address and try again.'
      );
    }

    setIsLoadingCustomToken(false);
  };

  const removeCustomToken = (symbol) => {
    setTokens(prevTokens => prevTokens.filter(token => 
      !(token.symbol === symbol && token.isCustom)
    ));
    setSymbols(prevSymbols => prevSymbols.filter(s => s !== symbol));
    
    // Reset selection if removed token was selected
    if (fromToken === symbol) setFromToken(MainAssetName);
    if (toToken === symbol) setToToken('USDC');
  };

  // Token search functionality
  const searchTokens = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      // First, search in existing tokens
      const existingMatches = tokens?.filter(token => 
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.address.toLowerCase().includes(query.toLowerCase())
      ) || [];

      let results = [...existingMatches];

      // If query looks like an address, try to fetch token data
      if (web3.utils.isAddress(query)) {
        try {
          const tokenData = await fetchTokenMetadata(query);
          
          // Check if this token already exists
          const exists = tokens?.some(token => 
            token.address.toLowerCase() === tokenData.address.toLowerCase()
          );

          if (!exists) {
            results.push({
              ...tokenData,
              isNewToken: true
            });
          }
        } catch (e) {
          console.log('Token search by address failed:', e);
        }
      }

      // You could also add external API search here for popular tokens
      // For example, searching CoinGecko, 1inch, or other token lists

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Token search error:', error);
      setSearchResults([]);
    }

    setIsSearching(false);
  };

  const selectSearchResult = (tokenData, isFromToken) => {
    if (tokenData.isNewToken) {
      // Add new token to the list
      const newToken = {
        symbol: tokenData.symbol,
        address: tokenData.address,
        decimals: tokenData.decimals,
        isCustom: true
      };

      setTokens(prevTokens => [...prevTokens, newToken]);
      setSymbols(prevSymbols => [...prevSymbols, tokenData.symbol]);
    }

    if (isFromToken) {
      setFromToken(tokenData.symbol);
      setFromTokenSearch('');
      setShowFromDropdown(false);
      handleFromTokenChange(tokenData.symbol);
    } else {
      setToToken(tokenData.symbol);
      setToTokenSearch('');
      setShowToDropdown(false);
      handleToTokenChange(tokenData.symbol);
    }

    setSearchResults([]);
  };

  const getFilteredTokens = (searchQuery) => {
    if (!searchQuery) return symbols || [];
    
    return symbols?.filter(symbol => 
      symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  };

  const getRate = async (from, to, amount, decimalsFrom, decimalsTo) => {
    let price = 0;

    // Early return conditions
    if (!amount || parseFloat(amount) <= 0 || from === to) {
      return price;
    }

    try {
      // Convert to Wei - fix potential precision issues
      const src = toWeiByDecimalsInput(decimalsFrom, amount.toString());
      
      // Validate that we have a valid Wei amount
      if (!src || src === '0' || new BigNumber(src).isZero()) {
        console.log("Invalid source amount:", src);
        return price;
      }

      // Handle ETH addresses - normalize before comparison
      const _from = String(from).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase() 
        ? WETH.toLowerCase() 
        : String(from).toLowerCase();
      const _to = String(to).toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase() 
        ? WETH.toLowerCase() 
        : String(to).toLowerCase();

      // Validate addresses
      if (!web3.utils.isAddress(_from) || !web3.utils.isAddress(_to)) {
        console.log("Invalid token addresses:", { _from, _to });
        return price;
      }

      // Same token check after address normalization
      if (_from === _to) {
        console.log("Same token after normalization");
        return src; // Return the same amount in Wei if tokens are the same
      }

      const router = new web3.eth.Contract(UNIRouterABI, UniV2Router);
      
      // First, try direct path
      const path = [_from, _to];
      console.log("Getting rate for path:", path, "amount:", src);
      
      try {
        const data = await router.methods.getAmountsOut(src, path).call();
        console.log("Direct path data:", data);
        
        if (data && data.length > 1 && data[1] && new BigNumber(data[1]).gt(0)) {
          price = data[1];
          console.log("Direct path successful:", price);
          return price;
        }
      } catch (directError) {
        console.log("Direct path failed:", directError.message);
      }

      // If direct path fails, try through WETH
      if ((!price || price === '0') && 
          _from !== WETH.toLowerCase() && 
          _to !== WETH.toLowerCase()) {
        
        try {
          console.log("Trying multi-hop route through WETH...");
          const multiHopPath = [_from, WETH.toLowerCase(), _to];
          const multiHopData = await router.methods.getAmountsOut(src, multiHopPath).call();
          
          console.log("Multi-hop data:", multiHopData);
          if (multiHopData && multiHopData.length > 2 && new BigNumber(multiHopData[2]).gt(0)) {
            price = multiHopData[2];
            console.log("Multi-hop route successful:", price);
            return price;
          }
        } catch (multiHopError) {
          console.log("Multi-hop also failed:", multiHopError.message);
        }
      }

      // If still no price and amount is large, try with smaller amount to test liquidity
      if ((!price || price === '0') && parseFloat(amount) > 1) {
        try {
          console.log("Trying with smaller amount to test liquidity...");
          const smallerAmount = (parseFloat(amount) * 0.1).toString(); // 10% of original
          const smallerSrc = toWeiByDecimalsInput(decimalsFrom, smallerAmount);
          
          const testData = await router.methods.getAmountsOut(smallerSrc, path).call();
          if (testData && testData.length > 1 && new BigNumber(testData[1]).gt(0)) {
            // Scale up the result proportionally
            const ratio = new BigNumber(src).div(smallerSrc);
            price = new BigNumber(testData[1]).multipliedBy(ratio).toString();
            console.log("Scaled rate calculated:", price);
            return price;
          }
        } catch (testError) {
          console.log("Smaller amount test failed:", testError.message);
        }
      }
      
    } catch (e) {
      console.log("Rate error details:", {
        message: e.message,
        from: from,
        to: to,
        amount: amount,
        wethAddress: WETH,
        routerAddress: UniV2Router,
        error: e
      });
    }

    // If all methods fail
    if (!price || price === '0') {
      console.log("No liquidity found for this pair after all attempts");
    }

    return price || '0';
  };

  const updateToAmount = async (amount) => {
    if (!amount || !tokens || parseFloat(amount) <= 0) {
      setToAmount('');
      setError('');
      return;
    }

    // Don't calculate if tokens are the same
    if (fromToken === toToken) {
      setToAmount(amount);
      setError('');
      return;
    }

    setIsCalculating(true);
    setError(''); // Clear any previous errors
    
    const fromTokenData = getTokenData(fromToken);
    const toTokenData = getTokenData(toToken);

    if (!fromTokenData || !toTokenData) {
      setToAmount('');
      setError('Token data not found');
      setIsCalculating(false);
      return;
    }

    try {
      const rate = await getRate(
        fromTokenData.address,
        toTokenData.address,
        amount,
        fromTokenData.decimals,
        toTokenData.decimals
      );

      if (rate && rate !== '0' && !new BigNumber(rate).isZero()) {
        const result = fromWeiByDecimalsInput(toTokenData.decimals, rate);
        setToAmount(result);
        setError(''); // Clear error on success
      } else {
        setToAmount('');
        setError(`No liquidity available for ${fromToken}/${toToken} pair`);
      }
    } catch (e) {
      console.log("Update amount error:", e);
      setToAmount('');
      setError('Unable to calculate exchange rate. Please try again.');
    }
    
    setIsCalculating(false);
  };

  const validateTokenPair = async (fromToken, toToken) => {
    const fromTokenData = getTokenData(fromToken);
    const toTokenData = getTokenData(toToken);
    
    if (!fromTokenData || !toTokenData) {
      return { valid: false, error: 'Invalid token selection' };
    }
    
    if (fromToken === toToken) {
      return { valid: false, error: 'Cannot trade the same token' };
    }
    
    // Test with a minimal amount to check if pair exists
    try {
      const testRate = await getRate(
        fromTokenData.address,
        toTokenData.address,
        '1', // Test with 1 unit
        fromTokenData.decimals,
        toTokenData.decimals
      );
      
      if (!testRate || testRate === '0') {
        return { valid: false, error: `No trading pair available for ${fromToken}/${toToken}` };
      }
      
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: 'Failed to validate trading pair' };
    }
  };

  const checkFundBalance = async () => {
    const fromTokenData = getTokenData(fromToken);
    if (!fromTokenData) return false;

    let fundBalance;
    
    try {
      if (fromTokenData.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
        fundBalance = await web3.eth.getBalance(address);
        fundBalance = web3.utils.fromWei(String(fundBalance), 'ether');
      } else {
        const ERC20 = new web3.eth.Contract(ERC20ABI, fromTokenData.address);
        fundBalance = await ERC20.methods.balanceOf(address).call();
        fundBalance = fromWeiByDecimalsInput(fromTokenData.decimals, fundBalance);
      }

      console.log(`Fund balance for ${fromToken}:`, fundBalance);
      return parseFloat(fundBalance) >= parseFloat(fromAmount);
    } catch (e) {
      console.log("Error checking fund balance:", e);
      return false;
    }
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

    if (!toAmount || parseFloat(toAmount) <= 0) {
      setError('Invalid exchange rate. Please try a different amount or token pair.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validate token pair
      const validation = await validateTokenPair(fromToken, toToken);
      if (!validation.valid) {
        setError(validation.error);
        setIsLoading(false);
        return;
      }

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
      const minReturn = new BigNumber(toAmountWei)
        .multipliedBy(100 - slippage)
        .dividedBy(100)
        .integerValue(BigNumber.ROUND_DOWN)
        .toString();

      console.log("Trade parameters:", {
        from: fromTokenData.address,
        amountIn: amountInWei,
        to: toTokenData.address,
        expectedOut: toAmountWei,
        minReturn: minReturn,
        slippage: slippage
      });

      modalClose();

      const { proof, positions } = getMerkleTreeData(toTokenData.address)

      // Execute trade
      smartFund.methods
        .trade(
          fromTokenData.address,
          amountInWei,
          toTokenData.address,
          UNI_V2_DEX_TYPE, // exchange type dependse on network
          proof, 
          positions, 
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
          setError('Trade failed. Please try again.');
          setIsLoading(false);
        });

    } catch (error) {
      console.error('Trade execution error:', error);
      setError('Cannot verify transaction data, please try again');
      setIsLoading(false);
    }
  };

  const switchTokens = () => {
    const newFromToken = toToken;
    const newToToken = fromToken;
    const newFromAmount = toAmount;
    
    setFromToken(newFromToken);
    setToToken(newToToken);
    setFromAmount(newFromAmount);
    setToAmount('');
    
    // Recalculate exchange rate
    if (newFromAmount && parseFloat(newFromAmount) > 0) {
      setTimeout(() => updateToAmount(newFromAmount), 100);
    }
  };

  const handleFromTokenChange = (newToken) => {
    setFromToken(newToken);
    setFromAmount('');
    setToAmount('');
    setError('');
  };

  const handleToTokenChange = (newToken) => {
    setToToken(newToken);
    setToAmount('');
    setError('');
    
    // Recalculate if we have a from amount
    if (fromAmount && parseFloat(fromAmount) > 0) {
      setTimeout(() => updateToAmount(fromAmount), 100);
    }
  };

  const handleFromAmountChange = (amount) => {
    setFromAmount(amount);
    
    if (amount && parseFloat(amount) > 0) {
      updateToAmount(amount);
    } else {
      setToAmount('');
      setError('');
    }
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
            <div className="flex items-center justify-between mb-2">
              <label className={`text-sm font-medium ${
                state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                From
              </label>
              <button
                onClick={() => setShowCustomToken(!showCustomToken)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  state.isDarkMode
                    ? 'text-blue-400 hover:bg-gray-700'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                {showCustomToken ? 'Hide Import' : '+ Import Token'}
              </button>
            </div>
            
            {/* Custom Token Import */}
            {showCustomToken && (
              <div className={`mb-4 p-4 border rounded-lg ${
                state.isDarkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className={`text-sm font-medium mb-3 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Import Custom Token
                </h4>
                
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customTokenAddress}
                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                    placeholder="Token contract address (0x...)"
                    className={`w-full p-2 text-sm border rounded ${
                      state.isDarkMode
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                  
                  {customTokenError && (
                    <p className={`text-xs ${
                      state.isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {customTokenError}
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={addCustomToken}
                      disabled={isLoadingCustomToken || !customTokenAddress.trim()}
                      className="flex-1 bg-blue-500 text-white px-3 py-2 text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                    >
                      {isLoadingCustomToken ? (
                        <>
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Loading...</span>
                        </>
                      ) : (
                        <span>Import Token</span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomToken(false);
                        setCustomTokenAddress('');
                        setCustomTokenError('');
                      }}
                      className={`px-3 py-2 text-sm rounded ${
                        state.isDarkMode
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                {/* Show selected token or search input */}
                {fromToken && !showFromDropdown ? (
                  /* Selected Token Chip */
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    state.isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getTokenData(fromToken)?.symbol || fromToken}
                      </span>
                      {getTokenData(fromToken)?.isCustom && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          state.isDarkMode 
                            ? 'bg-blue-600 text-blue-200' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          Custom
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setFromTokenSearch('');
                        setShowFromDropdown(true);
                        setSearchResults([]);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors ${
                        state.isDarkMode
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                      }`}
                      title="Change token"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  /* Search Input */
                  <div className="relative">
                    <input
                      type="text"
                      value={fromTokenSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFromTokenSearch(value);
                        
                        // If clearing the field, reset search results and show all tokens
                        if (value === '') {
                          setSearchResults([]);
                        } else {
                          searchTokens(value);
                        }
                      }}
                      onFocus={() => {
                        setShowFromDropdown(true);
                        if (!fromTokenSearch) {
                          setSearchResults([]);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicks
                        setTimeout(() => {
                          // If no token was selected, revert to showing selected token
                          if (!fromTokenSearch) {
                            setShowFromDropdown(false);
                          }
                        }, 200);
                      }}
                      placeholder="Search tokens..."
                      className={`w-full p-3 border rounded-lg ${
                        state.isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      autoFocus
                    />
                    
                    {/* Dropdown Results */}
                    {showFromDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
                        state.isDarkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-white border-gray-300'
                      }`}>
                        {isSearching && (
                          <div className="p-3 text-center">
                            <svg className="animate-spin w-4 h-4 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div>
                            <div className={`px-3 py-2 text-xs font-medium border-b ${
                              state.isDarkMode
                                ? 'text-gray-400 border-gray-600'
                                : 'text-gray-500 border-gray-200'
                            }`}>
                              Search Results
                            </div>
                            {searchResults.map((token, index) => (
                              <button
                                key={`search-${index}`}
                                onClick={() => selectSearchResult(token, true)}
                                className={`w-full text-left px-3 py-2 hover:bg-opacity-50 ${
                                  state.isDarkMode
                                    ? 'hover:bg-gray-600 text-white'
                                    : 'hover:bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{token.symbol}</span>
                                  <span className={`text-xs ${
                                    state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {token.isNewToken ? 'New' : token.isCustom ? 'Custom' : 'Listed'}
                                  </span>
                                </div>
                                <div className={`text-xs ${
                                  state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Existing Tokens */}
                        {(!fromTokenSearch || getFilteredTokens(fromTokenSearch).length > 0) && (
                          <div>
                            {searchResults.length > 0 && (
                              <div className={`px-3 py-2 text-xs font-medium border-b ${
                                state.isDarkMode
                                  ? 'text-gray-400 border-gray-600'
                                  : 'text-gray-500 border-gray-200'
                              }`}>
                                Available Tokens
                              </div>
                            )}
                            {(fromTokenSearch ? getFilteredTokens(fromTokenSearch) : symbols || []).slice(0, 8).map(symbol => {
                              const tokenData = getTokenData(symbol);
                              return (
                                <button
                                  key={symbol}
                                  onClick={() => {
                                    setFromToken(symbol);
                                    setFromTokenSearch('');
                                    setShowFromDropdown(false);
                                    setSearchResults([]);
                                    handleFromTokenChange(symbol);
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-opacity-50 ${
                                    state.isDarkMode
                                      ? 'hover:bg-gray-600 text-white'
                                      : 'hover:bg-gray-100 text-gray-900'
                                  } ${fromToken === symbol ? 'bg-blue-500 bg-opacity-20' : ''}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{symbol}</span>
                                    {tokenData?.isCustom && (
                                      <span className={`text-xs ${
                                        state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {fromTokenSearch && searchResults.length === 0 && getFilteredTokens(fromTokenSearch).length === 0 && !isSearching && (
                          <div className={`p-3 text-center text-sm ${
                            state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No tokens found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Remove custom token button (only show when token chip is displayed) */}
                {fromToken && !showFromDropdown && getTokenData(fromToken)?.isCustom && (
                  <button
                    onClick={() => removeCustomToken(fromToken)}
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      state.isDarkMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    title="Remove custom token"
                  >
                    ×
                  </button>
                )}
              </div>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
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
              disabled={isCalculating}
              className={`p-2 rounded-full border-2 transition-colors ${
                state.isDarkMode
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 text-gray-300'
                  : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-600'
              } ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <div className="flex-1 relative">
                {/* Show selected token or search input */}
                {toToken && !showToDropdown ? (
                  /* Selected Token Chip */
                  <div className={`flex items-center justify-between p-3 border rounded-lg ${
                    state.isDarkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-white border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        state.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {getTokenData(toToken)?.symbol || toToken}
                      </span>
                      {getTokenData(toToken)?.isCustom && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          state.isDarkMode 
                            ? 'bg-blue-600 text-blue-200' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          Custom
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setToTokenSearch('');
                        setShowToDropdown(true);
                        setSearchResults([]);
                      }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors ${
                        state.isDarkMode
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                      }`}
                      title="Change token"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  /* Search Input */
                  <div className="relative">
                    <input
                      type="text"
                      value={toTokenSearch}
                      onChange={(e) => {
                        const value = e.target.value;
                        setToTokenSearch(value);
                        
                        // If clearing the field, reset search results and show all tokens
                        if (value === '') {
                          setSearchResults([]);
                        } else {
                          searchTokens(value);
                        }
                      }}
                      onFocus={() => {
                        setShowToDropdown(true);
                        if (!toTokenSearch) {
                          setSearchResults([]);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding dropdown to allow clicks
                        setTimeout(() => {
                          // If no token was selected, revert to showing selected token
                          if (!toTokenSearch) {
                            setShowToDropdown(false);
                          }
                        }, 200);
                      }}
                      placeholder="Search tokens..."
                      className={`w-full p-3 border rounded-lg ${
                        state.isDarkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      autoFocus
                    />
                    
                    {/* Dropdown Results */}
                    {showToDropdown && (
                      <div className={`absolute top-full left-0 right-0 mt-1 border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto ${
                        state.isDarkMode
                          ? 'bg-gray-700 border-gray-600'
                          : 'bg-white border-gray-300'
                      }`}>
                        {isSearching && (
                          <div className="p-3 text-center">
                            <svg className="animate-spin w-4 h-4 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        )}
                        
                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div>
                            <div className={`px-3 py-2 text-xs font-medium border-b ${
                              state.isDarkMode
                                ? 'text-gray-400 border-gray-600'
                                : 'text-gray-500 border-gray-200'
                            }`}>
                              Search Results
                            </div>
                            {searchResults.map((token, index) => (
                              <button
                                key={`search-${index}`}
                                onClick={() => selectSearchResult(token, false)}
                                className={`w-full text-left px-3 py-2 hover:bg-opacity-50 ${
                                  state.isDarkMode
                                    ? 'hover:bg-gray-600 text-white'
                                    : 'hover:bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{token.symbol}</span>
                                  <span className={`text-xs ${
                                    state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {token.isNewToken ? 'New' : token.isCustom ? 'Custom' : 'Listed'}
                                  </span>
                                </div>
                                <div className={`text-xs ${
                                  state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Existing Tokens */}
                        {(!toTokenSearch || getFilteredTokens(toTokenSearch).length > 0) && (
                          <div>
                            {searchResults.length > 0 && (
                              <div className={`px-3 py-2 text-xs font-medium border-b ${
                                state.isDarkMode
                                  ? 'text-gray-400 border-gray-600'
                                  : 'text-gray-500 border-gray-200'
                              }`}>
                                Available Tokens
                              </div>
                            )}
                            {(toTokenSearch ? getFilteredTokens(toTokenSearch) : symbols || []).slice(0, 8).map(symbol => {
                              const tokenData = getTokenData(symbol);
                              return (
                                <button
                                  key={symbol}
                                  onClick={() => {
                                    setToToken(symbol);
                                    setToTokenSearch('');
                                    setShowToDropdown(false);
                                    setSearchResults([]);
                                    handleToTokenChange(symbol);
                                  }}
                                  className={`w-full text-left px-3 py-2 hover:bg-opacity-50 ${
                                    state.isDarkMode
                                      ? 'hover:bg-gray-600 text-white'
                                      : 'hover:bg-gray-100 text-gray-900'
                                  } ${toToken === symbol ? 'bg-blue-500 bg-opacity-20' : ''}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{symbol}</span>
                                    {tokenData?.isCustom && (
                                      <span className={`text-xs ${
                                        state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* No Results */}
                        {toTokenSearch && searchResults.length === 0 && getFilteredTokens(toTokenSearch).length === 0 && !isSearching && (
                          <div className={`p-3 text-center text-sm ${
                            state.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No tokens found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Remove custom token button (only show when token chip is displayed) */}
                {toToken && !showToDropdown && getTokenData(toToken)?.isCustom && (
                  <button
                    onClick={() => removeCustomToken(toToken)}
                    className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      state.isDarkMode
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                    title="Remove custom token"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={toAmount}
                  placeholder={isCalculating ? "Calculating..." : "0.0"}
                  className={`w-full p-3 border rounded-lg ${
                    state.isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } ${isCalculating ? 'opacity-50' : ''}`}
                  readOnly
                />
                {isCalculating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
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
            disabled={isLoading || !isManager || !fromAmount || !toAmount || isCalculating}
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