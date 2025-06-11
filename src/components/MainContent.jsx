// components/MainContent.js
import React from 'react';
import { useDeFi } from '../context/DeFiContext';
import SmartFundList from './SmartFundList';
import FundDetails from './FundDetails';
import Dashboard from './Dashboard';
import MockPage from './MockPage';

const MainContent = () => {
  const { state } = useDeFi();

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard':
        return <SmartFundList />;
      case 'funds':
        return <SmartFundList />;
      case 'fund-details':
        return <FundDetails />;
      case 'users':
        return <MockPage title="Users" description="Manage and view user profiles and statistics" />;
      case 'transactions':
        return <MockPage title="Transactions" description="View all platform transactions and activity" />;
      case 'analytics':
        return <MockPage title="Analytics" description="Deep dive into platform metrics and insights" />;
      case 'settings':
        return <MockPage title="Settings" description="Configure your platform preferences" />;
      default:
        return <SmartFundList />;
    }
  };

  return renderPage();
};

export default MainContent;