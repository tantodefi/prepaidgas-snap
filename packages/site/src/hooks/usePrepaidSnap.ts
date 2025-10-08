import { useState, useEffect, useCallback } from 'react';
import { defaultSnapOrigin } from '../config';

export type PrepaidCoupon = {
  id: string;
  paymasterAddress: string;
  poolType: 'multi-use' | 'single-use' | 'cache-enabled';
  chainId: string;
  network: string;
  addedAt: string;
  label?: string;
};

export type PaymasterData = {
  paymasterAddress: string;
  paymasterContext: string;
  poolType: string;
};

/**
 * Hook for managing Prepaid Gas Snap integration
 */
export function usePrepaidSnap() {
  const [coupons, setCoupons] = useState<PrepaidCoupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<PrepaidCoupon | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load coupons from snap
  const loadCoupons = useCallback(async () => {
    try {
      console.log('📥 Loading coupons from snap...');
      const result = (await window.ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId: defaultSnapOrigin,
          request: {
            method: 'listCoupons',
          },
        },
      })) as PrepaidCoupon[];

      console.log('📋 Loaded coupons:', result);
      setCoupons(result);

      // Auto-select first coupon if none selected
      if (!selectedCoupon && result.length > 0) {
        setSelectedCoupon(result[0]);
        console.log('✓ Auto-selected first coupon:', result[0]);
      }

      return result;
    } catch (err) {
      console.error('❌ Failed to load coupons:', err);
      return [];
    }
  }, [selectedCoupon]);

  // Add coupon to snap
  const addCoupon = useCallback(
    async (params: {
      paymasterContext: string;
      paymasterAddress: string;
      poolType: 'multi-use' | 'single-use' | 'cache-enabled';
      chainId: string;
      network: string;
      label?: string;
    }) => {
      setLoading(true);
      setError(null);

      try {
        console.log('➕ Adding coupon to snap...', params);
        const result = await window.ethereum.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: defaultSnapOrigin,
            request: {
              method: 'addCoupon',
              params,
            },
          },
        });

        console.log('✓ Coupon added successfully:', result);

        // Refresh coupon list
        await loadCoupons();

        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to add coupon';
        console.error('❌ Add coupon error:', err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadCoupons],
  );

  // Get paymaster data for transactions
  const getPaymasterData = useCallback(
    async (couponId?: string): Promise<PaymasterData | null> => {
      const targetCouponId = couponId || selectedCoupon?.id;
      if (!targetCouponId) {
        throw new Error('No coupon selected');
      }

      try {
        const result = (await window.ethereum.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: defaultSnapOrigin,
            request: {
              method: 'getPaymasterCallData',
              params: {
                couponId: targetCouponId,
              },
            },
          },
        })) as PaymasterData;

        return result;
      } catch (err) {
        console.error('Failed to get paymaster data:', err);
        throw err;
      }
    },
    [selectedCoupon],
  );

  // Remove coupon
  const removeCoupon = useCallback(
    async (couponId: string) => {
      try {
        await window.ethereum.request({
          method: 'wallet_invokeSnap',
          params: {
            snapId: defaultSnapOrigin,
            request: {
              method: 'removeCoupon',
              params: {
                couponId,
              },
            },
          },
        });

        // Refresh coupon list
        await loadCoupons();
      } catch (err) {
        console.error('Failed to remove coupon:', err);
        throw err;
      }
    },
    [loadCoupons],
  );

  return {
    // State
    coupons,
    selectedCoupon,
    setSelectedCoupon,
    loading,
    error,
    isConfigured: coupons.length > 0,

    // Actions
    addCoupon,
    loadCoupons,
    getPaymasterData,
    removeCoupon,
  };
}
