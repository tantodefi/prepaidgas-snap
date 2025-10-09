import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from './ui/Button';
import { Input, Label, FormGroup, Select } from './ui/Input';
import { Card } from './Card';
import { CounterDemo } from './CounterDemo';
import { usePrepaidSnap } from '../hooks/usePrepaidSnap';
import { defaultSnapOrigin } from '../config';

const ConfigContainer = styled.div`
  max-width: 500px;
  margin: 0 auto;
`;

const StatusIndicator = styled.div<{ status: 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;

  ${({ status, theme }) => {
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
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
        `;
    }
  }}
`;

const CouponList = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background?.alternative};
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border?.default};
`;

const CouponItem = styled.div`
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: ${({ theme }) => theme.colors.background?.default};
  border-radius: 0.375rem;
  font-size: 0.875rem;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  span {
    color: ${({ theme }) => theme.colors.text?.muted};
    font-size: 0.8125rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
`;

export const PrepaidConfig = () => {
  const {
    coupons,
    selectedCoupon,
    isConfigured,
    loading,
    error,
    addCoupon,
    loadCoupons,
    removeCoupon,
    getPaymasterData,
  } = usePrepaidSnap();

  const [showForm, setShowForm] = useState(false);

  // Load coupons on mount
  React.useEffect(() => {
    console.log('PrepaidConfig mounted, loading coupons...');
    loadCoupons().catch(console.error);
  }, []);

  // Debug logging
  React.useEffect(() => {
    console.log('PrepaidConfig state:', {
      couponsCount: coupons.length,
      isConfigured,
      showForm,
      shouldShowForm: showForm || coupons.length === 0,
    });
  }, [coupons, isConfigured, showForm]);

  const [formData, setFormData] = useState({
    couponCode: '', // Just paste the whole code
    label: '',
    // Advanced (hidden by default)
    paymasterContext: '',
    paymasterAddress: '',
    poolType: 'multi-use' as const,
    chainId: '11155111',
    network: 'sepolia',
  });

  const [configMode, setConfigMode] = useState<'quick' | 'manual'>('quick');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let paymasterContext = formData.paymasterContext;
      let paymasterAddress = formData.paymasterAddress;

      // Try to parse coupon code if in quick mode
      if (formData.couponCode && configMode === 'quick') {
        try {
          const parsed = JSON.parse(formData.couponCode);
          paymasterContext = parsed.paymasterContext || parsed.context;
          paymasterAddress = parsed.paymasterAddress || parsed.address;
        } catch {
          // If not JSON, assume it's just the context
          paymasterContext = formData.couponCode;
          // For now, use a placeholder - you'll need to update this
          paymasterAddress =
            paymasterAddress || '0x0000000000000000000000000000000000000000';
        }
      }

      // addCoupon from hook handles loading state
      await addCoupon({
        paymasterContext,
        paymasterAddress,
        poolType: formData.poolType,
        chainId: formData.chainId,
        network: formData.network,
        label: formData.label || undefined,
      });

      setShowForm(false);
      setFormData({
        couponCode: '',
        label: '',
        paymasterContext: '',
        paymasterAddress: '',
        poolType: 'multi-use',
        chainId: '11155111',
        network: 'sepolia',
      });
    } catch (err) {
      console.error('Failed to add coupon:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();

      if (configMode === 'manual') {
        // Parse into individual fields
        try {
          const parsed = JSON.parse(text);
          setFormData({
            couponCode: '',
            paymasterContext: parsed.paymasterContext || parsed.context || '',
            paymasterAddress: parsed.paymasterAddress || parsed.address || '',
            poolType: parsed.poolType || 'multi-use',
            chainId: parsed.chainId || '11155111',
            network: parsed.network || 'sepolia',
            label: parsed.label || '',
          });
        } catch {
          setFormData((prev) => ({
            ...prev,
            paymasterContext: text,
          }));
        }
      } else {
        // Just paste into coupon code field
        setFormData((prev) => ({
          ...prev,
          couponCode: text,
        }));
      }
    } catch (err) {
      alert('Failed to read from clipboard');
    }
  };

  return (
    <ConfigContainer>
      {/* Status Indicator */}
      <StatusIndicator status={isConfigured ? 'success' : 'warning'}>
        {isConfigured ? (
          <>
            <span>✓</span>
            <span>
              Paymaster Configured - {coupons.length} coupon
              {coupons.length !== 1 ? 's' : ''} available
            </span>
          </>
        ) : (
          <>
            <span>⚠️</span>
            <span>
              No coupons configured - Add your first prepaid gas coupon
            </span>
          </>
        )}
      </StatusIndicator>

      {error && (
        <StatusIndicator status="error">
          <span>❌</span>
          <span>{error}</span>
        </StatusIndicator>
      )}

      {/* Quick Add via Snap Dialog Button */}
      <Button
        onClick={async () => {
          try {
            const result = await window.ethereum.request({
              method: 'wallet_invokeSnap',
              params: {
                snapId: defaultSnapOrigin,
                request: { method: 'showAddCouponForm' },
              },
            });
            console.log('Snap form result:', result);
            // Reload coupons after adding
            await loadCoupons();
          } catch (err) {
            console.error('Failed to show snap form:', err);
          }
        }}
        fullWidth
        variant="secondary"
        style={{ marginBottom: '1rem' }}
      >
        ✨ Add Coupon in MetaMask
      </Button>

      {/* Add Coupon Form - Show by default if no coupons */}
      {showForm || coupons.length === 0 ? (
        <Card
          content={{
            title:
              coupons.length === 0
                ? 'Add Your First Coupon'
                : 'Add Prepaid Gas Coupon',
            description:
              'Enter your coupon details from testnet.prepaidgas.xyz',
          }}
          fullWidth
        >
          {/* Configuration Mode Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid #333',
            }}
          >
            <button
              type="button"
              onClick={() => setConfigMode('quick')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: configMode === 'quick' ? '#6F4CFF' : 'transparent',
                color: configMode === 'quick' ? 'white' : '#888',
                border: 'none',
                borderBottom:
                  configMode === 'quick' ? '2px solid #6F4CFF' : 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: configMode === 'quick' ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              📋 Paste Gas Card Context
            </button>
            <button
              type="button"
              onClick={() => setConfigMode('manual')}
              style={{
                flex: 1,
                padding: '0.75rem',
                background: configMode === 'manual' ? '#6F4CFF' : 'transparent',
                color: configMode === 'manual' ? 'white' : '#888',
                border: 'none',
                borderBottom:
                  configMode === 'manual' ? '2px solid #6F4CFF' : 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: configMode === 'manual' ? '600' : '400',
                transition: 'all 0.2s',
              }}
            >
              ⚙️ Manual Configuration
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {configMode === 'quick' ? (
              <>
                <div
                  style={{
                    background: 'rgba(111, 76, 255, 0.1)',
                    border: '1px solid rgba(111, 76, 255, 0.3)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: '#888',
                      marginBottom: '0.5rem',
                    }}
                  >
                    💡 Paste your Gas Card Context from testnet.prepaidgas.xyz
                  </div>
                </div>

                <FormGroup>
                  <Label>Gas Card Context</Label>
                  <Input
                    as="textarea"
                    rows={4}
                    value={formData.couponCode}
                    onChange={(e) =>
                      setFormData({ ...formData, couponCode: e.target.value })
                    }
                    placeholder="Paste your gas card context here..."
                    required
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Label (Optional)</Label>
                  <Input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    placeholder="e.g., My Gas Card"
                  />
                </FormGroup>
              </>
            ) : (
              <>
                <FormGroup>
                  <Label>Paymaster Context</Label>
                  <Input
                    type="text"
                    value={formData.paymasterContext}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymasterContext: e.target.value,
                      })
                    }
                    placeholder="0x..."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Paymaster Address</Label>
                  <Input
                    type="text"
                    value={formData.paymasterAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymasterAddress: e.target.value,
                      })
                    }
                    placeholder="0x..."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Pool Type</Label>
                  <Select
                    value={formData.poolType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        poolType: e.target.value as any,
                      })
                    }
                  >
                    <option value="multi-use">Multi-Use</option>
                    <option value="single-use">Single-Use</option>
                    <option value="cache-enabled">Cache-Enabled</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Chain ID</Label>
                  <Input
                    type="text"
                    value={formData.chainId}
                    onChange={(e) =>
                      setFormData({ ...formData, chainId: e.target.value })
                    }
                    placeholder="11155111"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Network</Label>
                  <Input
                    type="text"
                    value={formData.network}
                    onChange={(e) =>
                      setFormData({ ...formData, network: e.target.value })
                    }
                    placeholder="sepolia"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Label (Optional)</Label>
                  <Input
                    type="text"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData({ ...formData, label: e.target.value })
                    }
                    placeholder="My Coupon"
                  />
                </FormGroup>
              </>
            )}

            <ButtonGroup>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasteFromClipboard}
              >
                📋 Paste from Clipboard
              </Button>
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? 'Adding...' : 'Configure'}
              </Button>
            </ButtonGroup>

            {coupons.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                fullWidth
                style={{ marginTop: '0.75rem' }}
              >
                Cancel
              </Button>
            )}
          </form>
        </Card>
      ) : coupons.length > 0 ? (
        <Button onClick={() => setShowForm(true)} fullWidth>
          + Add Another Coupon
        </Button>
      ) : null}

      {/* Coupon List */}
      {coupons.length > 0 && (
        <CouponList>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
            Your Coupons
          </h3>
          {coupons.map((coupon) => (
            <CouponItem key={coupon.id}>
              <strong>{coupon.label || coupon.id}</strong>
              <span>
                {coupon.poolType} • {coupon.network}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => removeCoupon(coupon.id)}
                style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
              >
                Remove
              </Button>
            </CouponItem>
          ))}
        </CouponList>
      )}

      {isConfigured && (
        <>
          <Button
            variant="secondary"
            onClick={loadCoupons}
            fullWidth
            style={{ marginTop: '1rem' }}
          >
            Refresh Coupons
          </Button>

          {/* Show Counter Demo when configured */}
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '2px solid #333',
            }}
          >
            <h2
              style={{
                textAlign: 'center',
                marginBottom: '1rem',
                fontSize: '1.5rem',
              }}
            >
              🎯 Counter DApp Demo
            </h2>
            <p
              style={{
                textAlign: 'center',
                color: '#888',
                marginBottom: '2rem',
                fontSize: '0.875rem',
              }}
            >
              Test gasless transactions using your prepaid gas coupon!
            </p>
            <CounterDemo
              selectedCoupon={selectedCoupon}
              coupons={coupons}
              getPaymasterData={getPaymasterData}
            />
          </div>
        </>
      )}
    </ConfigContainer>
  );
};
