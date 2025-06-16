// components/SmartFundList.js
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, Filter, ChevronDown, Search, X, Settings, Calendar, DollarSign, User, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import SmartFundCard from './SmartFundCard';
import { MainAssetName } from '../config'

const SmartFundList = () => {
  const { state } = useDeFi();
  const [sortBy, setSortBy] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const fundsPerPage = 9; // Show 9 funds per page (3x3 grid)

  // Advanced filter state
  const [advancedFilters, setAdvancedFilters] = useState({
    owner: '',
    name: '',
    minValueInETH: '',
    minValueInUSD: '',
    minProfitInETH: '',
    minProfitInUSD: '',
    mainAsset: '',
    timeCreation: '',
    minROI: '',
    maxROI: ''
  });

  const sortOptions = [
    { value: '', label: 'Default Order' },
    { value: 'Higher value', label: 'Higher Value' },
    { value: 'Lower value', label: 'Lower Value' },
    { value: 'Higher profit', label: 'Higher Profit' },
    { value: 'Lower profit', label: 'Lower Profit' },
    { value: 'Higher ROI', label: 'Higher ROI' },
    { value: 'Lower ROI', label: 'Lower ROI' }
  ];

  const timeCreationOptions = [
    { value: '', label: 'All' },
    { value: 'Newest', label: 'Newest First' },
    { value: 'Oldest', label: 'Oldest First' }
  ];

  const mainAssetOptions = [
    { value: '', label: 'All Types' },
    { value: 'ETH', label: 'ETH Funds' },
    { value: 'USD', label: 'USD Funds' },
    { value: 'BTC', label: 'BTC Funds' },
    { value: 'MATIC', label: 'MATIC Funds' }
  ];

  // Calculate real stats from loaded funds
  const stats = useMemo(() => {
    if (!state.smartFunds || state.smartFunds.length === 0) {
      return [
        { label: 'Total TVL', value: '$0', change: '+0%', color: 'text-green-500' },
        { label: 'Active Funds', value: '0', change: '+0', color: 'text-blue-500' },
        { label: 'Total Users', value: '0', change: '+0', color: 'text-purple-500' },
        { label: 'Avg APY', value: '0%', change: '+0%', color: 'text-orange-500' }
      ];
    }

    // Calculate total TVL
    const totalTVL = state.smartFunds.reduce((sum, fund) => {
      const value = parseFloat(fund.historyProfitInUSD) || 0;
      return sum + value;
    }, 0);

    // Calculate total users
    const totalUsers = state.smartFunds.reduce((sum, fund) => {
      return sum + (fund.totalInvestors || 0);
    }, 0);

    // Calculate average APY
    const totalAPY = state.smartFunds.reduce((sum, fund) => {
      const apy = parseFloat(fund.apy?.replace('%', '')) || 0;
      return sum + apy;
    }, 0);
    const avgAPY = state.smartFunds.length > 0 ? totalAPY / state.smartFunds.length : 0;

    // Format TVL
    const formatTVL = (value) => {
      if (value === 0) return '$0';
      if (value < 1000) return `$${value.toFixed(2)}`;
      if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${(value / 1000000).toFixed(1)}M`;
    };

    return [
      { 
        label: 'Total TVL', 
        value: formatTVL(totalTVL), // for TLV we use history, but in production should be current
        change: '+12.5%', 
        color: 'text-green-500' 
      },
      { 
        label: 'Active Funds', 
        value: state.smartFunds.length.toString(), 
        change: '+3', 
        color: 'text-blue-500' 
      },
      { 
        label: 'Total Users', 
        value: String(state.smartFunds.length * 3), // mock total users
        change: '+89', 
        color: 'text-purple-500' 
      },
      { 
        label: 'Avg APY', 
        value: `${avgAPY.toFixed(1)}%`, 
        change: '+4.2%', 
        color: 'text-orange-500' 
      }
    ];
  }, [state.smartFunds]);

  // Function to extract numeric value from string (e.g., "$1.2M" -> 1200000)
  const parseValue = (valueStr) => {
    if (!valueStr) return 0;
    
    // Convert to string and remove currency symbols and commas
    const cleanStr = String(valueStr).replace(/[$,€£¥]/g, '');
    
    // Handle different multipliers
    const lowerStr = cleanStr.toLowerCase();
    let multiplier = 1;
    let numStr = cleanStr;
    
    if (lowerStr.includes('k')) {
      multiplier = 1000;
      numStr = cleanStr.replace(/[kK]/g, '');
    } else if (lowerStr.includes('m')) {
      multiplier = 1000000;
      numStr = cleanStr.replace(/[mM]/g, '');
    } else if (lowerStr.includes('b')) {
      multiplier = 1000000000;
      numStr = cleanStr.replace(/[bB]/g, '');
    }
    
    const number = parseFloat(numStr);
    return isNaN(number) ? 0 : number * multiplier;
  };

  // Function to extract percentage value (e.g., "12.5%" -> 12.5)
  const parsePercentage = (percentStr) => {
    if (!percentStr) return 0;
    const cleanStr = String(percentStr).replace('%', '');
    const number = parseFloat(cleanStr);
    return isNaN(number) ? 0 : number;
  };

  // Helper function to remove empty values from filter object
  const removeEmptyValues = (obj) => {
    const newObj = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] && obj[key] !== '' && obj[key] !== 0) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  };

  // String filter helper
  const stringFilter = (item, key, value) => {
    const itemValue = item[key] || '';
    return itemValue.toLowerCase().includes(value.toLowerCase());
  };

  // Number filter helper (greater than or equal)
  const numberFilter = (itemValue, filterValue) => {
    const numericItemValue = parseValue(itemValue.toString());
    return numericItemValue >= filterValue;
  };

  // ROI filter helper
  const roiFilter = (item, minROI, maxROI) => {
    const roi = parsePercentage(item.roi || item.apy || item.return || '0%');
    if (minROI && roi < minROI) return false;
    if (maxROI && roi > maxROI) return false;
    return true;
  };

  // Time creation filter helper
  const timeCreationFilter = (funds, sortType) => {
    if (sortType === 'Newest') {
      return [...funds].sort((a, b) => {
        const timeA = a.timeCreation || a.createdAt || 0;
        const timeB = b.timeCreation || b.createdAt || 0;
        return Number(timeB) - Number(timeA);
      });
    } else if (sortType === 'Oldest') {
      return [...funds].sort((a, b) => {
        const timeA = a.timeCreation || a.createdAt || 0;
        const timeB = b.timeCreation || b.createdAt || 0;
        return Number(timeA) - Number(timeB);
      });
    }
    return funds;
  };

  // Apply advanced filters
  const applyAdvancedFilters = (funds, filters) => {
    const cleanFilters = removeEmptyValues(filters);
    let filteredFunds = [...funds];

    Object.keys(cleanFilters).forEach(key => {
      const filterValue = cleanFilters[key];

      switch (key) {
        case 'name':
        case 'owner':
          filteredFunds = filteredFunds.filter(fund => 
            stringFilter(fund, key, filterValue)
          );
          break;

        case 'mainAsset':
          filteredFunds = filteredFunds.filter(fund => 
            stringFilter(fund, key, filterValue) || 
            stringFilter(fund, 'asset', filterValue) ||
            stringFilter(fund, 'baseAsset', filterValue)
          );
          break;

        case 'minValueInETH':
          filteredFunds = filteredFunds.filter(fund => 
            numberFilter(fund.valueInETH || fund.tvlETH || '0', filterValue)
          );
          break;

        case 'minValueInUSD':
          filteredFunds = filteredFunds.filter(fund => 
            numberFilter(fund.valueInUSD || fund.tvl || fund.value || '0', filterValue)
          );
          break;

        case 'minProfitInETH':
          filteredFunds = filteredFunds.filter(fund => 
            numberFilter(fund.profitInETH || fund.profitETH || '0', filterValue)
          );
          break;

        case 'minProfitInUSD':
          filteredFunds = filteredFunds.filter(fund => 
            numberFilter(fund.profitInUSD || fund.profit || fund.totalProfit || '0', filterValue)
          );
          break;

        case 'timeCreation':
          filteredFunds = timeCreationFilter(filteredFunds, filterValue);
          break;

        default:
          break;
      }
    });

    // Apply ROI filter separately as it needs both min and max
    if (cleanFilters.minROI || cleanFilters.maxROI) {
      filteredFunds = filteredFunds.filter(fund => 
        roiFilter(fund, cleanFilters.minROI, cleanFilters.maxROI)
      );
    }

    return filteredFunds;
  };

  // Sorting functions
  const sortFunds = (funds, sortType) => {
    if (!funds || funds.length === 0) return [];
    const sortedFunds = [...funds];

    switch (sortType) {
      case 'Higher value':
        return sortedFunds.sort((a, b) => {
          const valueA = parseValue(a.valueInUSD || a.tvl || a.value || '0');
          const valueB = parseValue(b.valueInUSD || b.tvl || b.value || '0');
          return valueB - valueA;
        });

      case 'Lower value':
        return sortedFunds.sort((a, b) => {
          const valueA = parseValue(a.valueInUSD || a.tvl || a.value || '0');
          const valueB = parseValue(b.valueInUSD || b.tvl || b.value || '0');
          return valueA - valueB;
        });

      case 'Higher profit':
        return sortedFunds.sort((a, b) => {
          const profitA = parseValue(a.profitInUSD || a.profit || a.totalProfit || '0');
          const profitB = parseValue(b.profitInUSD || b.profit || b.totalProfit || '0');
          return profitB - profitA;
        });

      case 'Lower profit':
        return sortedFunds.sort((a, b) => {
          const profitA = parseValue(a.profitInUSD || a.profit || a.totalProfit || '0');
          const profitB = parseValue(b.profitInUSD || b.profit || b.totalProfit || '0');
          return profitA - profitB;
        });

      case 'Higher ROI':
        return sortedFunds.sort((a, b) => {
          const roiA = parsePercentage(a.apy || a.roi || a.return || '0%');
          const roiB = parsePercentage(b.apy || b.roi || b.return || '0%');
          return roiB - roiA;
        });

      case 'Lower ROI':
        return sortedFunds.sort((a, b) => {
          const roiA = parsePercentage(a.apy || a.roi || a.return || '0%');
          const roiB = parsePercentage(b.apy || b.roi || b.return || '0%');
          return roiA - roiB;
        });

      default:
        return sortedFunds; // Return original order
    }
  };

  // Filter funds by search query
  const filterFundsBySearch = (funds, query) => {
    if (!query.trim()) return funds;
    
    const lowercaseQuery = query.toLowerCase();
    return funds.filter(fund => 
      fund.name?.toLowerCase().includes(lowercaseQuery) ||
      fund.title?.toLowerCase().includes(lowercaseQuery) ||
      fund.strategy?.toLowerCase().includes(lowercaseQuery) ||
      fund.description?.toLowerCase().includes(lowercaseQuery) ||
      fund.owner?.toLowerCase().includes(lowercaseQuery) ||
      fund.address?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Memoized filtered and sorted funds
  const filteredAndSortedFunds = useMemo(() => {
    if (!state.smartFunds || state.smartFunds.length === 0) return [];
    // First apply advanced filters
    let filteredFunds = applyAdvancedFilters(state.smartFunds, advancedFilters);
    // Then filter by search query
    filteredFunds = filterFundsBySearch(filteredFunds, searchQuery);
    // Finally sort the filtered results
    const sortedFunds = sortFunds(filteredFunds, sortBy);

    return sortedFunds;
  }, [state.smartFunds, sortBy, searchQuery, advancedFilters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedFunds.length / fundsPerPage);
  const startIndex = (currentPage - 1) * fundsPerPage;
  const endIndex = startIndex + fundsPerPage;
  const currentFunds = filteredAndSortedFunds.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, advancedFilters]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Smooth scroll to top of funds section
    document.getElementById('funds-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination for many pages
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) pages.push('...');
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handleSortChange = (sortExpression) => {
    setSortBy(sortExpression);
    setIsFilterOpen(false);
  };

  const handleAdvancedFilterChange = (key, value) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      owner: '',
      name: '',
      minValueInETH: '',
      minValueInUSD: '',
      minProfitInETH: '',
      minProfitInUSD: '',
      mainAsset: '',
      timeCreation: '',
      minROI: '',
      maxROI: ''
    });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    return Object.values(removeEmptyValues(advancedFilters)).length;
  };

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error loading smart funds: {state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Smart Funds {MainAssetName}</h1>
          <p className={`${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Pioneers in the DEFI world since 2017
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className={`p-4 rounded-xl border backdrop-blur-sm ${
            state.isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'
          }`}>
            <p className={`text-xs ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
              {stat.label}
            </p>
            <p className="text-lg font-bold mb-1">{stat.value}</p>
            <p className={`text-xs ${stat.color} flex items-center`}>
              <ArrowUpRight className="w-3 h-3 mr-1" />
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Search and Filter Section */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${state.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
            <input
              type="text"
              placeholder="Search funds by name, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 ${
                state.isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white/50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                  state.isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filter Panel */}
        {isAdvancedFilterOpen && (
          <div className={`w-full max-w-4xl mx-auto p-6 rounded-lg border shadow-lg z-30 ${
            state.isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Advanced Filters</h3>
              <button
                onClick={() => setIsAdvancedFilterOpen(false)}
                className={`p-2 rounded-lg ${
                  state.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fund Name */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Search className="w-4 h-4" />
                  <span>Fund Name</span>
                </label>
                <input
                  type="text"
                  value={advancedFilters.name}
                  onChange={(e) => handleAdvancedFilterChange('name', e.target.value)}
                  placeholder="Enter fund name"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Manager Address */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <User className="w-4 h-4" />
                  <span>Manager Address</span>
                </label>
                <input
                  type="text"
                  value={advancedFilters.owner}
                  onChange={(e) => handleAdvancedFilterChange('owner', e.target.value)}
                  placeholder="Enter manager address"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Fund Type */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Fund Type</span>
                </label>
                <select
                  value={advancedFilters.mainAsset}
                  onChange={(e) => handleAdvancedFilterChange('mainAsset', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {mainAssetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Value in MATIC */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <DollarSign className="w-4 h-4" />
                  <span>Min Value (MATIC)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.minValueInETH}
                  onChange={(e) => handleAdvancedFilterChange('minValueInETH', Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Min Value in USD */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <DollarSign className="w-4 h-4" />
                  <span>Min Value (USD)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.minValueInUSD}
                  onChange={(e) => handleAdvancedFilterChange('minValueInUSD', Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Min Profit in MATIC */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Min Profit (MATIC)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.minProfitInETH}
                  onChange={(e) => handleAdvancedFilterChange('minProfitInETH', Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Min Profit in USD */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Min Profit (USD)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.minProfitInUSD}
                  onChange={(e) => handleAdvancedFilterChange('minProfitInUSD', Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Min ROI */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Min ROI (%)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.minROI}
                  onChange={(e) => handleAdvancedFilterChange('minROI', Number(e.target.value))}
                  placeholder="0"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Max ROI */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Max ROI (%)</span>
                </label>
                <input
                  type="number"
                  value={advancedFilters.maxROI}
                  onChange={(e) => handleAdvancedFilterChange('maxROI', Number(e.target.value))}
                  placeholder="100"
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Time Creation */}
              <div className="space-y-2">
                <label className={`text-sm font-medium flex items-center space-x-1 ${
                  state.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <Calendar className="w-4 h-4" />
                  <span>Time Creation</span>
                </label>
                <select
                  value={advancedFilters.timeCreation}
                  onChange={(e) => handleAdvancedFilterChange('timeCreation', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm ${
                    state.isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  {timeCreationOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetAdvancedFilters}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  state.isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Reset Filters
              </button>
              <button
                onClick={() => setIsAdvancedFilterOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg border transition-all duration-200 ${
                  state.isDarkMode 
                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-white' 
                    : 'bg-white/50 border-gray-200 hover:bg-gray-50 text-gray-900'
                } ${sortBy ? 'ring-2 ring-blue-500/30' : ''}`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {sortBy ? sortOptions.find(opt => opt.value === sortBy)?.label : 'Sort by'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isFilterOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Sort Dropdown Menu */}
              {isFilterOpen && (
                <div className={`absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 rounded-lg border shadow-lg z-50 ${
                  state.isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 ${
                          sortBy === option.value
                            ? state.isDarkMode
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-700'
                            : state.isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Filter Button */}
            <button
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg border transition-all duration-200 ${
                state.isDarkMode 
                  ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 text-white' 
                  : 'bg-white/50 border-gray-200 hover:bg-gray-50 text-gray-900'
              } ${getActiveFiltersCount() > 0 ? 'ring-2 ring-orange-500/30' : ''}`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Advanced Filter</span>
              {getActiveFiltersCount() > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  state.isDarkMode 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-500 text-white'
                }`}>
                  {getActiveFiltersCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filters Display */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {searchQuery && (
            <span className={`text-sm px-3 py-1 rounded-full flex items-center space-x-1 ${
              state.isDarkMode 
                ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              <Search className="w-3 h-3" />
              <span>"{searchQuery}"</span>
              <button onClick={clearSearch} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {sortBy && (
            <span className={`text-sm px-3 py-1 rounded-full flex items-center space-x-1 ${
              state.isDarkMode 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <Filter className="w-3 h-3" />
              <span>{sortOptions.find(opt => opt.value === sortBy)?.label}</span>
              <button onClick={() => setSortBy('')} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {getActiveFiltersCount() > 0 && (
            <span className={`text-sm px-3 py-1 rounded-full flex items-center space-x-1 ${
              state.isDarkMode 
                ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' 
                : 'bg-orange-50 text-orange-700 border border-orange-200'
            }`}>
              <Settings className="w-3 h-3" />
              <span>{getActiveFiltersCount()} Advanced Filter{getActiveFiltersCount() > 1 ? 's' : ''}</span>
              <button onClick={resetAdvancedFilters} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div id="funds-section" className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Available Funds
          {filteredAndSortedFunds.length > 0 && (
            <span className={`ml-2 text-lg font-normal ${
              state.isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              ({filteredAndSortedFunds.length})
            </span>
          )}
        </h2>
        {filteredAndSortedFunds.length > 0 && totalPages > 1 && (
          <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedFunds.length)} of {filteredAndSortedFunds.length} funds
          </p>
        )}
      </div>

      {/* Smart Funds Grid */}
      {currentFunds.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFunds.map((fund) => (
              <SmartFundCard key={fund.id || fund.address} fund={fund} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {/* Previous Button */}
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex space-x-1">
                {getPageNumbers().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className={`px-3 py-2 ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ...
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-blue-500 text-white'
                            : state.isDarkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${state.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* No funds message */
        <div className={`text-center py-12 ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {searchQuery || getActiveFiltersCount() > 0 ? (
            <>
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No funds found</p>
              <p className="text-sm mb-4">
                No funds match your current search and filter criteria
              </p>
              <div className="flex justify-center space-x-3">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      state.isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Clear search
                  </button>
                )}
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={resetAdvancedFilters}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      state.isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No funds available</p>
              <p className="text-sm">Check back later for new investment opportunities</p>
            </>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isFilterOpen || isAdvancedFilterOpen) && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setIsFilterOpen(false);
            setIsAdvancedFilterOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default SmartFundList;