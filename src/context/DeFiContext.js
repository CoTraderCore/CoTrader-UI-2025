// context/DeFiContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Mock data
const mockSmartFunds = [
  {
    id: '1',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Yield Maximizer Pro',
    description: 'Automated yield farming strategy with dynamic rebalancing',
    tvl: '$2.4M',
    apy: '127.5%',
    risk: 'High',
    category: 'Yield Farming',
    performance: '+23.4%',
    assets: ['ETH', 'USDC', 'DAI'],
    manager: '0xabcdef1234567890abcdef1234567890abcdef12',
    inception: '2024-01-15',
    totalInvestors: 234,
    minimumInvestment: '0.1 ETH'
  },
  {
    id: '2',
    address: '0x2345678901bcdef12345678901bcdef123456789',
    name: 'Stable Income Fund',
    description: 'Conservative stablecoin strategies for steady returns',
    tvl: '$8.7M',
    apy: '12.3%',
    risk: 'Low',
    category: 'Stablecoin',
    performance: '+8.2%',
    assets: ['USDC', 'USDT', 'DAI'],
    manager: '0xbcdef1234567890abcdef1234567890abcdef123',
    inception: '2023-08-22',
    totalInvestors: 567,
    minimumInvestment: '100 USDC'
  },
  {
    id: '3',
    address: '0x3456789012cdef123456789012cdef1234567890',
    name: 'DeFi Index Alpha',
    description: 'Diversified DeFi protocol exposure with auto-compounding',
    tvl: '$5.1M',
    apy: '45.7%',
    risk: 'Medium',
    category: 'Index',
    performance: '+18.9%',
    assets: ['UNI', 'AAVE', 'COMP', 'SUSHI'],
    manager: '0xcdef1234567890abcdef1234567890abcdef1234',
    inception: '2023-12-01',
    totalInvestors: 123,
    minimumInvestment: '0.05 ETH'
  }
];

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
      return { ...state, smartFunds: action.payload, isDataLoaded: true };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER_DATA':
      return { ...state, userData: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, isDarkMode: !state.isDarkMode };
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_SELECTED_FUND':
      return { ...state, selectedFund: action.payload };
    default:
      return state;
  }
};

// DeFi Provider Component
export const DeFiProvider = ({ children }) => {
  const [state, dispatch] = useReducer(defiReducer, {
    smartFunds: [],
    userData: null,
    isDataLoaded: false,
    isLoading: false,
    isDarkMode: true,
    currentPage: 'dashboard',
    selectedFund: null
  });

  const initializeData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    // Simulate API call
    setTimeout(() => {
      dispatch({ type: 'SET_SMART_FUNDS', payload: mockSmartFunds });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  };

  useEffect(() => {
    initializeData();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => window.location.reload());
    }
  }, []);

  return (
    <DeFiContext.Provider value={{ state, dispatch }}>
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