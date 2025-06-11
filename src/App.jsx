// App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { DeFiProvider, useDeFi } from './context/DeFiContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import SmartFundList from './components/SmartFundList';
import FundDetails from './components/FundDetails';
import MockPage from './components/MockPage';

// Layout Component
const Layout = ({ children }) => {
  const { state } = useDeFi();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      state.isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
    }`}>
      <Navbar />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`lg:hidden fixed top-20 left-4 z-30 p-2 rounded-lg ${
            state.isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } shadow-lg`}
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Main content */}
        <main className="flex-1 lg:ml-64 p-6 pt-20 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Main App Component with Router
const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default route - redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard route */}
        <Route path="/dashboard" element={
          <Layout>
            <MockPage 
              title="Dashboard" 
              description="Welcome to your DeFi dashboard" 
            />
          </Layout>
        } />
        
        {/* Funds list route */}
        <Route path="/funds" element={
          <Layout>
            <SmartFundList />
          </Layout>
        } />
        
        {/* Fund details route */}
        <Route path="/page/:fundAddress" element={
          <Layout>
            <FundDetails />
          </Layout>
        } />
        
        {/* Users route */}
        <Route path="/users" element={
          <Layout>
            <MockPage 
              title="Users" 
              description="Manage and view user information" 
            />
          </Layout>
        } />
        
        {/* Transactions route */}
        <Route path="/transactions" element={
          <Layout>
            <MockPage 
              title="Transactions" 
              description="View and track all transaction history" 
            />
          </Layout>
        } />
        
        {/* Analytics route */}
        <Route path="/analytics" element={
          <Layout>
            <MockPage 
              title="Analytics" 
              description="Comprehensive analytics and insights" 
            />
          </Layout>
        } />
        
        {/* Settings route */}
        <Route path="/settings" element={
          <Layout>
            <MockPage 
              title="Settings" 
              description="Configure your application preferences" 
            />
          </Layout>
        } />
        
        {/* Catch all route - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// App with Provider
const AppWithProvider = () => {
  return (
    <DeFiProvider>
      <App />
    </DeFiProvider>
  );
};

export default AppWithProvider;