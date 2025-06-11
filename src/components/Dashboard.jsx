// components/SmartFundList.js
import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDeFi } from '../context/DeFiContext';
import SmartFundCard from './SmartFundCard';

const Dashboard = () => {
  const { state } = useDeFi();
  const [currentPage, setCurrentPage] = useState(1);
  const fundsPerPage = 3;

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
      const value = parseFloat(fund.valueInUSD) || 0;
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
        value: formatTVL(totalTVL), 
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
        value: totalUsers.toLocaleString(), 
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

  // Pagination logic
  const totalPages = Math.ceil((state.smartFunds?.length || 0) / fundsPerPage);
  const startIndex = (currentPage - 1) * fundsPerPage;
  const endIndex = startIndex + fundsPerPage;
  const currentFunds = state.smartFunds?.slice(startIndex, endIndex) || [];

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
          <h1 className="text-3xl font-bold mb-2">Smart Funds</h1>
          <p className={`${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Discover and invest in automated DeFi strategies
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

      {/* Smart Funds Grid */}
      <div id="funds-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Available Funds</h2>
          {state.smartFunds && state.smartFunds.length > 0 && (
            <p className={`text-sm ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing {startIndex + 1}-{Math.min(endIndex, state.smartFunds.length)} of {state.smartFunds.length} funds
            </p>
          )}
        </div>

        {currentFunds.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFunds.map((fund) => (
                <SmartFundCard key={fund.id} fund={fund} />
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
          <div className="text-center py-12">
            <p className={`text-lg ${state.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No smart funds available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;