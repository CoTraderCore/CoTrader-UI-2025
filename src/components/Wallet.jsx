// components/Wallet.js
import React, { useState, useContext, useEffect } from "react";
import { Wallet as WalletIcon, User, AlertCircle, Loader } from "lucide-react";
import getWeb3 from "../models/getWeb3";
import Web3Context from "../context/Web3Context";

const connectWallet = async (setWeb3, setAccounts, setNetId, setIsConnecting, setError) => {
  try {
    setIsConnecting(true);
    setError('');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install MetaMask and try again.');
    }

    const response = await getWeb3();
    setWeb3(response);
    
    const netId = await response.eth.net.getId();
    setNetId(netId);
    
    const accounts = await response.eth.getAccounts();
    setAccounts(accounts);
    
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please unlock MetaMask and try again.');
    }
    
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    setError(error.message || "Failed to connect wallet. Please try again.");
  } finally {
    setIsConnecting(false);
  }
};

const Wallet = () => {
  const context = useContext(Web3Context);
  const web3 = context?.web3;
  const accounts = context?.accounts;
  const setWeb3 = context?.setWeb3;
  const setAccounts = context?.setAccounts;
  const setNetId = context?.setNetId;
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const disconnectWallet = () => {
    if (setWeb3) setWeb3(null);
    if (setAccounts) setAccounts([]);
    if (setNetId) setNetId(null);
    setError('');
  };

  const handleConnect = () => {
    if (!setWeb3 || !setAccounts || !setNetId) {
      setError('Wallet context not available');
      return;
    }
    connectWallet(setWeb3, setAccounts, setNetId, setIsConnecting, setError);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const isConnected = web3 && accounts && accounts.length > 0;

  return (
    <div className="relative inline-block">
      {isConnected ? (
        <button
          className={`
            flex items-center justify-center gap-2 px-4 py-2.5 min-w-[120px]
            bg-gradient-to-r from-green-500 to-green-600 
            hover:from-green-600 hover:to-green-700
            text-white font-semibold text-sm rounded-lg
            transition-all duration-300 ease-in-out
            shadow-lg shadow-green-500/30 hover:shadow-green-500/40
            hover:-translate-y-0.5 hover:shadow-xl
            disabled:opacity-70 disabled:cursor-not-allowed
            disabled:hover:transform-none disabled:hover:shadow-lg
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={disconnectWallet}
          disabled={isConnecting}
        >
          <User size={14} />
          <span>{formatAddress(accounts[0])}</span>
        </button>
      ) : (
        <button
          className={`
            flex items-center justify-center gap-2 px-4 py-2.5 min-w-[120px]
            bg-gradient-to-r from-blue-500 to-purple-500 
            hover:from-blue-600 hover:to-purple-600
            text-white font-semibold text-sm rounded-lg
            transition-all duration-300 ease-in-out
            shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40
            hover:-translate-y-0.5 hover:shadow-xl
            disabled:opacity-70 disabled:cursor-not-allowed
            disabled:hover:transform-none disabled:hover:shadow-lg
          `}
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader size={14} className="animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <WalletIcon size={14} />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      )}
      
      {/* Tooltip for connected state */}
      {showTooltip && isConnected && (
        <div className="absolute top-full right-0 mt-1 px-3 py-2 bg-gray-900/95 text-white text-xs rounded-lg border border-gray-700/50 shadow-xl z-50 whitespace-nowrap">
          Click to disconnect
        </div>
      )}
      
      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full right-0 mt-1 px-3 py-2 bg-red-500/95 text-white text-xs rounded-lg border border-red-500/50 shadow-xl z-50 max-w-[250px]">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;