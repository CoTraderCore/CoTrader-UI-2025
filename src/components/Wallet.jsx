// Wallet.js
import React, { useState } from "react";
import { Wallet as WalletIcon, User, LogOut, AlertCircle, Loader } from "lucide-react";
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

function Wallet(props) {
  const context = React.useContext(Web3Context);
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

  const buttonStyle = {
    background: web3 && accounts?.length > 0 
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: isConnecting ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '13px',
    boxShadow: web3 && accounts?.length > 0 
      ? '0 2px 8px rgba(16, 185, 129, 0.3)' 
      : '0 2px 8px rgba(99, 102, 241, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: '120px',
    justifyContent: 'center',
    opacity: isConnecting ? 0.7 : 1,
    position: 'relative'
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const tooltipStyle = {
    position: 'absolute',
    top: '100%',
    right: '0',
    background: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(71, 85, 105, 0.5)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'white',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: showTooltip ? 'block' : 'none'
  };

  const errorStyle = {
    position: 'absolute',
    top: '100%',
    right: '0',
    background: 'rgba(239, 68, 68, 0.95)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'white',
    fontSize: '12px',
    maxWidth: '250px',
    zIndex: 1000,
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    display: error ? 'block' : 'none'
  };

  // Clear error after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {web3 && accounts && accounts.length > 0 ? (
        <button
          style={buttonStyle}
          onMouseOver={(e) => {
            if (!isConnecting) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
              setShowTooltip(true);
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            setShowTooltip(false);
          }}
          onClick={disconnectWallet}
          disabled={isConnecting}
        >
          <User size={14} />
          {formatAddress(accounts[0])}
        </button>
      ) : (
        <button
          style={buttonStyle}
          onClick={handleConnect}
          disabled={isConnecting}
          onMouseOver={(e) => {
            if (!isConnecting) {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)';
          }}
        >
          {isConnecting ? (
            <>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              Connecting...
            </>
          ) : (
            <>
              <WalletIcon size={14} />
              Connect Wallet
            </>
          )}
        </button>
      )}
      
      {/* Tooltip for connected state */}
      <div style={tooltipStyle}>
        Click to disconnect
      </div>
      
      {/* Error tooltip */}
      <div style={errorStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={12} />
          {error}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Wallet;