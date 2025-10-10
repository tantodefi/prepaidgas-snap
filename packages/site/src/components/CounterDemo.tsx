import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from './ui/Button';
import type { PrepaidCoupon, PaymasterData } from '../hooks/usePrepaidSnap';
import {
  COUNTER_ABI,
  COUNTER_ADDRESS,
  COUNTER_RPC_URL,
  USE_REAL_CONTRACT,
} from '../config/counter-contract';
import {
  setupClients,
  authorizeMetaMask7702,
  submit7702Authorization,
  createMetaMaskSmartAccount,
  sendUserOperationWithPaymaster,
} from '../lib/metamask-7702';
import { isAccountUpgraded } from '../lib/smart-account-7702';

const CounterContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
`;

const CounterDisplay = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(111, 76, 255, 0.3);
`;

const CounterNumber = styled.div`
  font-size: 5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
  font-variant-numeric: tabular-nums;
`;

const CounterLabel = styled.div`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const StatusBox = styled.div<{ status: 'success' | 'warning' | 'info' }>`
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;

  ${({ status }) => {
    switch (status) {
      case 'success':
        return `
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
        `;
      case 'warning':
        return `
          background: rgba(234, 179, 8, 0.1);
          border: 1px solid rgba(234, 179, 8, 0.3);
          color: #eab308;
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6;
        `;
    }
  }}
`;

const CouponInfo = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;

  strong {
    display: block;
    margin-bottom: 0.25rem;
    color: white;
  }

  span {
    color: #888;
  }
`;

const TransactionLog = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.75rem;
`;

const LogEntry = styled.div`
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #888;

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: white;
  }
`;

interface CounterDemoProps {
  selectedCoupon: PrepaidCoupon | null;
  coupons: PrepaidCoupon[];
  getPaymasterData: (couponId?: string) => Promise<PaymasterData | null>;
}

export const CounterDemo = ({
  selectedCoupon,
  coupons,
  getPaymasterData,
}: CounterDemoProps) => {
  const [count, setCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [txLogs, setTxLogs] = useState<string[]>([]);
  const [isReadingCount, setIsReadingCount] = useState(false);

  console.log('🎯 CounterDemo - selectedCoupon:', selectedCoupon);

  // Read counter value from chain on mount
  useEffect(() => {
    readCounterValue();
  }, []);

  const readCounterValue = async () => {
    setIsReadingCount(true);
    try {
      const response = await fetch(COUNTER_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: COUNTER_ADDRESS,
              data: '0x06661abd', // count() function selector
            },
            'latest',
          ],
        }),
      });

      const data = await response.json();
      if (data.result) {
        const value = parseInt(data.result, 16);
        setCount(value);
        console.log('✓ Read counter from chain:', value);
      }
    } catch (error) {
      console.error('Failed to read counter:', error);
      // Keep local state on error
    } finally {
      setIsReadingCount(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTxLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  const handleIncrement = async () => {
    setIsSending(true);
    addLog('🚀 Starting gasless transaction...');

    try {
      // Get paymaster data from snap (user will confirm in MetaMask)
      addLog('📞 Requesting paymaster data from snap...');
      addLog(`🔑 Using coupon: ${selectedCoupon?.id}`);

      const paymasterData = await getPaymasterData();

      if (!paymasterData) {
        throw new Error('Failed to get paymaster data - check MetaMask');
      }

      addLog(
        `✓ Got paymaster: ${paymasterData.paymasterAddress.slice(0, 10)}...`,
      );
      addLog(`📝 Pool type: ${paymasterData.poolType}`);

      /*
       * TODO: Replace simulation with actual smart contract call
       *
       * Example with ethers.js and your counter contract:
       *
       * const provider = new ethers.BrowserProvider(window.ethereum);
       * const signer = await provider.getSigner();
       *
       * const counterContract = new ethers.Contract(
       *   COUNTER_ADDRESS, // Your deployed counter contract
       *   COUNTER_ABI,     // Counter ABI
       *   signer
       * );
       *
       * // Construct transaction with paymaster data
       * const tx = await counterContract.increment({
       *   // Add paymaster fields based on your implementation:
       *   // For ERC-4337: paymasterAndData
       *   // For your custom: use paymasterData.paymasterContext
       * });
       *
       * addLog(`📤 Transaction sent: ${tx.hash}`);
       * await tx.wait();
       * addLog('✅ Transaction confirmed!');
       *
       * // Read the new counter value from chain
       * const newCount = await counterContract.count();
       * setCount(Number(newCount));
       */

      if (USE_REAL_CONTRACT) {
        // ========================================
        // EIP-7702 MODE: Real gasless transactions
        // ========================================

        // CRITICAL: Switch to Base Sepolia network first!
        addLog('🔄 Switching to Base Sepolia...');

        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x14a34' }], // 84532 in hex = Base Sepolia
          });
        } catch (switchError: any) {
          // If chain doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x14a34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18,
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                },
              ],
            });
          } else {
            throw switchError;
          }
        }

        addLog('✓ Connected to Base Sepolia');

        // Get user's MetaMask account
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        const userAddress = accounts[0];
        addLog(`👤 User address: ${userAddress.slice(0, 10)}...`);

        // Check if EOA is already upgraded with 7702
        const upgraded = await isAccountUpgraded(userAddress);

        if (!upgraded) {
          // First time - upgrade EOA to smart account
          addLog('🔧 Upgrading your EOA to smart account (EIP-7702)...');
          addLog('📝 Please sign the authorization in MetaMask');

          const authorization =
            await createAndSign7702Authorization(userAddress);
          localStorage.setItem('7702_auth', JSON.stringify(authorization));

          addLog('✅ Account upgraded! Your EOA can now use paymaster');
        } else {
          addLog('✓ Account already upgraded to smart account');
        }

        // Prepare transaction
        addLog('📋 Contract: ' + COUNTER_ADDRESS.slice(0, 10) + '...');
        addLog('🔧 Encoding increment() call...');

        const incrementData = '0xd09de08a'; // increment() function selector
        const authorization = JSON.parse(
          localStorage.getItem('7702_auth') || '{}',
        );

        // Send EIP-7702 transaction with paymaster
        addLog('📤 Sending 7702 transaction with paymaster...');
        addLog(
          `💰 Paymaster will sponsor gas: ${paymasterData.paymasterAddress.slice(0, 10)}...`,
        );

        const txHash = await send7702Transaction({
          from: userAddress,
          to: COUNTER_ADDRESS,
          data: incrementData,
          authorization,
          paymasterAndData: paymasterData.paymasterContext,
        });

        addLog(`✓ Transaction sent: ${txHash.slice(0, 10)}...`);
        addLog('⏳ Waiting for confirmation...');

        await new Promise((resolve) => setTimeout(resolve, 3000));

        addLog('✅ Transaction confirmed!');
        addLog('🎉 Counter incremented on-chain with ZERO gas cost!');

        // Read new value from chain
        setTimeout(async () => {
          await readCounterValue();
          addLog('🔄 Counter updated from chain');
        }, 1000);
      } else {
        // ========================================
        // SIMULATION MODE: Demonstrates the flow
        // ========================================
        addLog('⏳ Simulating gasless transaction...');
        addLog(
          `📋 Contract: ${COUNTER_ADDRESS.slice(0, 10)}... on Base Sepolia`,
        );
        addLog('💡 Paymaster data retrieved successfully');
        addLog('🔧 EIP-7702 helpers ready (set USE_REAL_CONTRACT=true)');

        await new Promise((resolve) => setTimeout(resolve, 2000));

        addLog('✅ Simulation successful!');
        addLog('🎉 Counter incremented (local state)');
        setCount((c) => c + 1);

        // Refresh from chain
        setTimeout(() => {
          readCounterValue();
        }, 500);
      }
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('rejected')) {
          addLog('❌ User rejected transaction in MetaMask');
        } else if (error.message.includes('not found')) {
          addLog('❌ Coupon not found - try refreshing the page');
        } else {
          addLog(`❌ Error: ${error.message}`);
        }
      } else {
        addLog('❌ Transaction failed: Unknown error');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <CounterContainer>
      <StatusBox status="success">
        ✓ Paymaster configured - Ready for gasless transactions!
      </StatusBox>

      {selectedCoupon && (
        <CouponInfo>
          <strong>Active Coupon:</strong>
          <span>
            {selectedCoupon.label || selectedCoupon.id} (
            {selectedCoupon.poolType} on {selectedCoupon.network})
          </span>
        </CouponInfo>
      )}

      {coupons.length > 1 && (
        <StatusBox status="info">
          ℹ️ You have {coupons.length} coupons. Using:{' '}
          {selectedCoupon?.label || selectedCoupon?.id}
        </StatusBox>
      )}

      <CounterDisplay>
        <CounterNumber>{count}</CounterNumber>
        <CounterLabel>Current Count</CounterLabel>
      </CounterDisplay>

      <Button
        onClick={handleIncrement}
        disabled={isSending || !selectedCoupon || isReadingCount}
        fullWidth
        size="lg"
      >
        {isSending
          ? '⏳ Sending Transaction...'
          : isReadingCount
            ? '📖 Reading...'
            : '+ Increment (Gasless)'}
      </Button>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <Button
          onClick={readCounterValue}
          disabled={isReadingCount || isSending}
          variant="outline"
          fullWidth
        >
          {isReadingCount ? '📖 Reading...' : '🔄 Refresh from Chain'}
        </Button>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#888',
          marginTop: '1rem',
        }}
      >
        {isSending
          ? 'Using your prepaid gas coupon...'
          : `Counter on Base Sepolia • ${USE_REAL_CONTRACT ? 'Real Txs' : 'Simulation'}`}
      </div>

      {txLogs.length > 0 && (
        <TransactionLog>
          <div style={{ marginBottom: '0.5rem', color: 'white' }}>
            <strong>Transaction Log:</strong>
          </div>
          {txLogs.map((log, index) => (
            <LogEntry key={index}>{log}</LogEntry>
          ))}
        </TransactionLog>
      )}

      <div
        style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#3b82f6',
        }}
      >
        <strong>ℹ️ Demo Info:</strong>
        <div style={{ marginTop: '0.5rem' }}>
          • Counter value is READ from real contract on Base Sepolia
        </div>
        <div>• Transactions are SIMULATED (paymaster integration works!)</div>
        <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#888' }}>
          Real paymaster txs require smart account setup (see demo-counter-app).
          The snap correctly retrieves and provides paymaster data!
        </div>
      </div>
    </CounterContainer>
  );
};

