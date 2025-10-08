import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from './ui/Button';
import type { PrepaidCoupon, PaymasterData } from '../hooks/usePrepaidSnap';

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

  console.log('🎯 CounterDemo - selectedCoupon:', selectedCoupon);

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
      const paymasterData = await getPaymasterData();

      if (!paymasterData) {
        throw new Error('Failed to get paymaster data');
      }

      addLog(
        `✓ Got paymaster: ${paymasterData.paymasterAddress.slice(0, 10)}...`,
      );
      addLog(`📝 Pool type: ${paymasterData.poolType}`);

      // TODO: Replace with actual smart contract transaction
      // For now, simulate the transaction
      addLog('⏳ Sending transaction with paymaster...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      addLog('✅ Transaction confirmed!');
      addLog('🎉 Counter incremented using prepaid gas');
      setCount((c) => c + 1);
    } catch (error) {
      console.error('Transaction failed:', error);
      if (error instanceof Error && error.message.includes('rejected')) {
        addLog('❌ User rejected transaction');
      } else {
        addLog(
          `❌ Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
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
        disabled={isSending || !selectedCoupon}
        fullWidth
        size="lg"
      >
        {isSending ? '⏳ Sending Transaction...' : '+ Increment (Gasless)'}
      </Button>

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
          : 'Click to increment using gasless transaction'}
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
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          color: '#eab308',
        }}
      >
        <strong>Note:</strong> This is a demo simulation. Replace the TODO in
        CounterDemo.tsx with your actual smart contract call to increment a
        counter on-chain using the paymaster data.
      </div>
    </CounterContainer>
  );
};
