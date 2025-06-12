// DepositERC20.js - Updated for Chakra UI v3.21.0
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Stack,
  HStack,
  Button,
  Input,
  Text,
  Box,
  Alert,
  Badge,
  Spinner
} from '@chakra-ui/react';
import { IoLockClosed, IoAdd, IoWarning } from 'react-icons/io5';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { APIEnpoint, SmartFundABIV7, ERC20ABI } from '../../../config.js';
import setPending from '../../../utils/setPending.js';
import { toWeiByDecimalsInput, fromWeiByDecimalsInput } from '../../../utils/weiByDecimals';
import Web3Context from '../../../context/Web3Context';
import { useDeFi } from '../../../context/DeFiContext';

function DepositERC20({ mainAsset, address, pending, modalClose }) {
  const { web3, accounts } = useContext(Web3Context);
  const { state } = useDeFi();
  const [depositValue, setDepositValue] = useState('');
  const [valueError, setValueError] = useState('');
  const [ercAssetAddress, setErcAssetAddress] = useState(null);
  const [ercAssetContract, setErcAssetContract] = useState(null);
  const [isApproved, setIsApproved] = useState(true);
  const [approvePending, setApprovePending] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);

  // Color mode values based on your theme system
  const inputBg = state.isDarkMode ? 'gray.700' : 'white';
  const inputBorder = state.isDarkMode ? 'gray.600' : 'gray.300';
  const textColor = state.isDarkMode ? 'white' : 'gray.900';
  const secondaryText = state.isDarkMode ? 'gray.300' : 'gray.600';
  const badgeBg = state.isDarkMode ? 'gray.600' : 'gray.100';

  const updateAllowance = useCallback(async () => {
    if (!ercAssetContract || !accounts || !accounts[0] || !depositValue) return false;

    try {
      const allowance = await ercAssetContract.methods.allowance(
        accounts[0],
        address
      ).call();

      const decimals = await ercAssetContract.methods.decimals().call();
      const allowanceFromWei = fromWeiByDecimalsInput(decimals, allowance);

      const approved = Number(allowanceFromWei) >= Number(depositValue);
      setIsApproved(approved);
      return approved;
    } catch (error) {
      console.error('Error updating allowance:', error);
      return false;
    }
  }, [ercAssetContract, accounts, address, depositValue]);

  useEffect(() => {
    const initializeContract = async () => {
      if (!web3 || !accounts || !accounts[0]) return;

      try {
        const fund = new web3.eth.Contract(SmartFundABIV7, address);
        const assetAddress = await fund.methods.coreFundAsset().call();
        const assetContract = new web3.eth.Contract(ERC20ABI, assetAddress);
        const tokenSymbol = await assetContract.methods.symbol().call();
        const decimals = await assetContract.methods.decimals().call();
        const balanceInWei = await assetContract.methods.balanceOf(accounts[0]).call();
        const balance = fromWeiByDecimalsInput(BigNumber(decimals), balanceInWei);

        setErcAssetAddress(assetAddress);
        setErcAssetContract(assetContract);
        setSymbol(tokenSymbol);
        setTokenBalance(parseFloat(balance).toFixed(4));
      } catch (error) {
        console.error('Error initializing contract:', error);
      }
    };

    initializeContract();
  }, [web3, accounts, address]);

  useEffect(() => {
    if (depositValue && parseFloat(depositValue) > 0) {
      updateAllowance();
    }
  }, [depositValue, updateAllowance]);

  const checkAllowanceInterval = () => {
    const timerId = setInterval(async () => {
      const approved = await updateAllowance();
      if (approved) {
        clearInterval(timerId);
        setApprovePending(false);
      }
    }, 3000);
  };

  const validation = async () => {
    setValueError('');
    setIsLoading(true);

    if (!depositValue || parseFloat(depositValue) <= 0) {
      setValueError("Value must be greater than 0");
      setIsLoading(false);
      return;
    }

    try {
      const ercAssetDecimals = await ercAssetContract.methods.decimals().call();
      const userWalletBalance = await ercAssetContract.methods.balanceOf(accounts[0]).call();
      const userBalanceFromWei = fromWeiByDecimalsInput(ercAssetDecimals, userWalletBalance);

      if (parseFloat(depositValue) > parseFloat(userBalanceFromWei)) {
        setValueError(`Not enough ${symbol}`);
        setIsLoading(false);
        return;
      }

      await depositERC20();
    } catch (error) {
      console.error('Validation error:', error);
      setValueError('Error validating transaction');
      setIsLoading(false);
    }
  };

  const unlockERC20 = async () => {
    setIsLoading(true);
    try {
      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      let block = await web3.eth.getBlockNumber();

      ercAssetContract.methods.approve(
        address,
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      )
      .send({ from: accounts[0] })
      .on('transactionHash', (hash) => {
        pending(true, txCount + 1);
        setPending(address, 1, accounts[0], block, hash, "Approve");
        checkAllowanceInterval();
        setApprovePending(true);
        setIsLoading(false);
      })
      .on('error', (error) => {
        console.error('Approve error:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Unlock error:', error);
      alert("Can not verify transaction data, please try again in a minute");
      setIsLoading(false);
    }
  };

  const depositERC20 = async () => {
    try {
      const ercAssetDecimals = await ercAssetContract.methods.decimals().call();
      const amount = toWeiByDecimalsInput(ercAssetDecimals, depositValue);

      const fundERC20 = new web3.eth.Contract(SmartFundABIV7, address);

      let txCount = await axios.get(APIEnpoint + 'api/user-pending-count/' + accounts[0]);
      txCount = txCount.data.result;

      let block = await web3.eth.getBlockNumber();

      modalClose();

      fundERC20.methods.deposit(amount)
      .send({ from: accounts[0] })
      .on('transactionHash', (hash) => {
        pending(true, txCount + 1);
        setPending(address, 1, accounts[0], block, hash, "Deposit");
        setIsLoading(false);
      })
      .on('error', (error) => {
        console.error('Deposit error:', error);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Deposit error:', error);
      alert("Can not verify transaction data, please try again in a minute");
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    setDepositValue(tokenBalance);
  };

  return (
    <Stack gap={4} align="stretch">
      <Box>
        <HStack justify="space-between" marginBottom={3}>
          <Text fontSize="sm" fontWeight="medium" color={secondaryText}>
            Enter {symbol || 'Token'}
          </Text>
          <Button
            size="xs"
            variant="outline"
            colorPalette="blue"
            onClick={handleMaxClick}
            borderRadius="lg"
            fontSize="xs"
            paddingX={3}
            paddingY={1.5}
          >
            Balance: {tokenBalance}
          </Button>
        </HStack>
        
        <Box position="relative">
          <Input
            type="number"
            min="0"
            step="0.000001"
            placeholder="0.0"
            value={depositValue}
            onChange={(e) => setDepositValue(e.target.value)}
            fontSize="lg"
            height={16}
            backgroundColor={inputBg}
            border="1px"
            borderColor={inputBorder}
            borderRadius="xl"
            color={textColor}
            _placeholder={{ color: secondaryText }}
            _focus={{
              borderColor: "blue.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)"
            }}
            paddingRight={20}
          />
          <Box
            position="absolute"
            right={4}
            top="50%"
            transform="translateY(-50%)"
          >
            <Badge
              backgroundColor={badgeBg}
              color={secondaryText}
              paddingX={2}
              paddingY={1}
              borderRadius="md"
              fontSize="sm"
              fontWeight="medium"
            >
              {symbol || 'TOKEN'}
            </Badge>
          </Box>
        </Box>
        
        {valueError && (
          <Alert status="error" marginTop={2} borderRadius="lg">
            <Box color="red.500" marginRight={2}>
              <IoWarning />
            </Box>
            <Text fontSize="sm">{valueError}</Text>
          </Alert>
        )}
      </Box>

      {!isApproved ? (
        <Stack gap={3} align="stretch">
          <Button
            onClick={unlockERC20}
            disabled={isLoading || approvePending}
            loading={isLoading}
            loadingText="Processing..."
            background="linear-gradient(to right, #f56500, #dc2626)"
            color="white"
            height={16}
            borderRadius="xl"
            fontWeight="semibold"
            _hover={{
              background: "linear-gradient(to right, #ea580c, #b91c1c)",
              transform: "translateY(-1px)",
              boxShadow: "xl"
            }}
            _disabled={{
              opacity: 0.5,
              cursor: "not-allowed",
              _hover: { transform: "none" }
            }}
            transition="all 0.2s"
            boxShadow="lg"
          >
            {isLoading ? (
              <HStack>
                <Spinner size="sm" />
                <Text>Processing...</Text>
              </HStack>
            ) : (
              <HStack>
                <IoLockClosed />
                <Text>Unlock {symbol || 'Token'}</Text>
              </HStack>
            )}
          </Button>
          
          {approvePending && (
            <Alert status="info" borderRadius="lg">
              <HStack>
                <Spinner size="sm" />
                <Text fontSize="sm">
                  Waiting for approval confirmation...
                </Text>
              </HStack>
            </Alert>
          )}
        </Stack>
      ) : (
        <Button
          onClick={validation}
          disabled={isLoading || !depositValue || parseFloat(depositValue) <= 0}
          loading={isLoading}
          loadingText="Processing..."
          background="linear-gradient(to right, #059669, #0891b2)"
          color="white"
          height={16}
          borderRadius="xl"
          fontWeight="semibold"
          _hover={{
            background: "linear-gradient(to right, #047857, #0e7490)",
            transform: "translateY(-1px)",
            boxShadow: "xl"
          }}
          _disabled={{
            opacity: 0.5,
            cursor: "not-allowed",
            _hover: { transform: "none" }
          }}
          transition="all 0.2s"
          boxShadow="lg"
        >
          {isLoading ? (
            <HStack>
              <Spinner size="sm" />
              <Text>Processing...</Text>
            </HStack>
          ) : (
            <HStack>
              <IoAdd />
              <Text>Deposit {symbol || 'Token'}</Text>
            </HStack>
          )}
        </Button>
      )}
    </Stack>
  );
}

export default DepositERC20;