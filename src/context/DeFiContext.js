// context/DeFiContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import getFundsList from '../utils/getFundsList';

const mockTransactions = [
  {
    id: '1',
    type: 'Deposit',
    amount: '1.5 ETH',
    usdValue: '$2,847.50',
    timestamp: '2024-06-09 14:32:18',
    txHash: '0xabc123...',
    status: 'Confirmed'
  },
  {
    id: '2',
    type: 'Withdraw',
    amount: '0.3 ETH',
    usdValue: '$569.50',
    timestamp: '2024-06-08 09:15:42',
    txHash: '0xdef456...',
    status: 'Confirmed'
  },
  {
    id: '3',
    type: 'Reward Claim',
    amount: '0.12 ETH',
    usdValue: '$227.80',
    timestamp: '2024-06-07 16:20:33',
    txHash: '0x789abc...',
    status: 'Confirmed'
  }
];

// Context
const DeFiContext = createContext();

// Reducer for managing DeFi state
const defiReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SMART_FUNDS':
      return { ...state, smartFunds: action.payload, isDataLoaded: true, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_SELECTED_FUND':
      return { ...state, selectedFund: action.payload };
    case 'REFRESH_FUNDS':
      return { ...state, isDataLoaded: false, error: null };
    default:
      return state;
  }
};

// Helper function to get risk level based on fund type and manager fee
const getRiskLevel = (fundType, managerFee) => {
  if (!fundType) return 'Unknown';
  
  const type = fundType.toLowerCase();
  const fee = parseInt(managerFee) || 0;
  
  if (type.includes('stable') || fee < 1000) return 'Low';
  if (type.includes('light') || fee < 2000) return 'Medium';
  return 'High';
};

// Helper function to mock APY based on fund characteristics
const getMockedAPY = (fundType, valueInUSD, profitInUSD) => {
  const profit = parseFloat(profitInUSD) || 0;
  const value = parseFloat(valueInUSD) || 1;
  
  // If we have actual profit data, calculate rough APY
  if (profit > 0 && value > 0) {
    const roughAPY = (profit / value) * 100;
    return `${roughAPY.toFixed(1)}%`;
  }
  
  // Otherwise mock based on fund type
  const type = (fundType || '').toLowerCase();
  if (type.includes('stable')) return `${(Math.random() * 15 + 5).toFixed(1)}%`; // 5-20%
  if (type.includes('light')) return `${(Math.random() * 50 + 20).toFixed(1)}%`; // 20-70%
  return `${(Math.random() * 100 + 30).toFixed(1)}%`; // 30-130%
};

// Helper function to get assets from balance array
const getAssetsFromBalance = (balance) => {
  if (!balance || !Array.isArray(balance)) return ['ETH'];
  
  return balance
    .filter(item => parseFloat(item.percentInETH) > 0)
    .map(item => item.symbol)
    .slice(0, 4); // Limit to 4 assets for display
};

// Helper function to get total investors from shares
const getTotalInvestors = (shares) => {
  if (!shares || !Array.isArray(shares)) return 0;
  return shares.length;
};

// Helper function to format USD values
const formatUSDValue = (value) => {
  const num = parseFloat(value) || 0;
  if (num === 0) return '$0';
  if (num < 1000) return `$${num.toFixed(2)}`;
  if (num < 1000000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${(num / 1000000).toFixed(1)}M`;
};

// Helper function to transform API data to match your expected format
const transformFundData = (apiFunds) => {
  if (!Array.isArray(apiFunds)) return [];
  
  return apiFunds.map((fund, index) => {
    // Parse balance if it's a string
    let balanceArray = [];
    try {
      balanceArray = typeof fund.balance === 'string' ? JSON.parse(fund.balance) : fund.balance || [];
    } catch (e) {
      console.warn('Failed to parse balance for fund:', fund.address);
    }

    // Parse shares if it's a string
    let sharesArray = [];
    try {
      sharesArray = typeof fund.shares === 'string' ? JSON.parse(fund.shares) : fund.shares || [];
    } catch (e) {
      console.warn('Failed to parse shares for fund:', fund.address);
    }

    const assets = getAssetsFromBalance(balanceArray);
    const totalInvestors = getTotalInvestors(sharesArray);
    const riskLevel = getRiskLevel(fund.fundType, fund.managerFee);
    const mockedAPY = getMockedAPY(fund.fundType, fund.valueInUSD, fund.profitInUSD);

    return {
      // Required fields from API
      id: fund.address, // Use address as unique ID
      address: fund.address,
      name: fund.name || 'Unnamed Fund',
      owner: fund.owner,
      
      // Financial data from API
      valueInETH: fund.valueInETH || '0',
      valueInUSD: fund.valueInUSD || '0',
      profitInETH: fund.profitInETH || '0',
      profitInUSD: fund.profitInUSD || '0',
      historyProfitInETH: fund.historyProfitInETH || '0',
      historyProfitInUSD: fund.historyProfitInUSD || '0',
      
      // Fund configuration from API
      mainAsset: fund.mainAsset || 'MATIC',
      managerFee: fund.managerFee || 0,
      fundType: fund.fundType || 'General',
      version: fund.version || 1,
      tradeVerification: fund.tradeVerification || 0,
      
      // Raw data for compatibility with existing components
      balance: balanceArray,
      shares: sharesArray,
      
      // Transformed/formatted fields for new dashboard
      tvl: formatUSDValue(fund.valueInUSD),
      apy: mockedAPY,
      risk: riskLevel,
      category: fund.fundType || 'General',
      performance: fund.profitInUSD && parseFloat(fund.profitInUSD) !== 0 
        ? `${parseFloat(fund.profitInUSD) > 0 ? '+' : ''}${parseFloat(fund.profitInUSD).toFixed(1)}%`
        : '+0%',
      assets: assets,
      manager: fund.owner,
      totalInvestors: totalInvestors,
      
      // Mocked fields not provided by API
      description: `${fund.fundType || 'DeFi'} fund with ${fund.mainAsset || 'MATIC'} as main asset`,
      inception: fund.timeCreation ? new Date(fund.timeCreation * 1000).toISOString().split('T')[0] : '2024-01-01',
      minimumInvestment: `0.1 ${fund.mainAsset || 'MATIC'}`,
    };
  });
};

// DeFi Provider Component
export const DeFiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(defiReducer, {
    smartFunds: [],
    userData: null,
    isDataLoaded: false,
    isLoading: false,
    error: null,
    isDarkMode: true,
    currentPage: 'dashboard',
    selectedFund: null
  });

  const loadSmartFunds = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const apiResponse = await getFundsList();
      
      if (apiResponse && Array.isArray(apiResponse)) {
        const transformedFunds = transformFundData(apiResponse);
        dispatch({ type: 'SET_SMART_FUNDS', payload: transformedFunds });
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error loading smart funds:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Don't show alert here, let components handle the error state
    }
  };

  const refreshFunds = () => {
    dispatch({ type: 'REFRESH_FUNDS' });
    loadSmartFunds();
  };

  useEffect(() => {
    loadSmartFunds();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        refreshFunds();
      });
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const contextValue = {
    state,
    dispatch,
    refreshFunds,
    loadSmartFunds
  };

  return (
    <DeFiContext.Provider value={contextValue}>
      {children}
    </DeFiContext.Provider>
  );
};

// Hook to use DeFi context
export const useDeFi = () => {
  const context = useContext(DeFiContext);
  if (!context) {
    throw new Error('useDeFi must be used within a DeFiProvider');
  }
  return context;
};

export { mockTransactions };