/**
 * Prepaid Gas Snap Client
 *
 * Helper utility for dapps to integrate with the Prepaid Gas Snap
 * This file can be used as a reference or copied into your dapp
 */

import type {
  AddCouponParams,
  GetCouponParams,
  RemoveCouponParams,
  PublicCouponData,
  PaymasterCallData,
  AddCouponResponse,
  ShowAddCouponDialogResponse,
  SuccessResponse,
} from './types';

// Default snap ID - update this when published to npm
const DEFAULT_SNAP_ID = 'npm:prepaidgas-snap';

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
}

/**
 * Check if the snap is installed and connected
 */
export async function isSnapInstalled(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    return false;
  }

  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });
    return Object.keys(snaps).includes(snapId);
  } catch {
    return false;
  }
}

/**
 * Connect to the snap (install if not already installed)
 */
export async function connectSnap(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    throw new Error(
      'MetaMask is not installed. Please install MetaMask Flask to use snaps.',
    );
  }

  try {
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: {},
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to connect to snap:', error);
    return false;
  }
}

/**
 * Invoke a snap method
 */
async function invokeSnap<T>(
  method: string,
  params?: unknown,
  snapId: string = DEFAULT_SNAP_ID,
): Promise<T> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method,
        params,
      },
    },
  });

  return result as T;
}

/**
 * Add a new prepaid gas coupon
 */
export async function addCoupon(
  params: AddCouponParams,
  snapId?: string,
): Promise<AddCouponResponse> {
  return invokeSnap<AddCouponResponse>('addCoupon', params, snapId);
}

/**
 * Get a specific coupon by ID (without sensitive data)
 */
export async function getCoupon(
  couponId: string,
  snapId?: string,
): Promise<PublicCouponData> {
  return invokeSnap<PublicCouponData>('getCoupon', { couponId }, snapId);
}

/**
 * List all stored coupons (without sensitive data)
 */
export async function listCoupons(
  snapId?: string,
): Promise<PublicCouponData[]> {
  return invokeSnap<PublicCouponData[]>('listCoupons', undefined, snapId);
}

/**
 * Remove a coupon
 */
export async function removeCoupon(
  couponId: string,
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('removeCoupon', { couponId }, snapId);
}

/**
 * Get paymaster call data for a transaction
 * This requires user confirmation
 */
export async function getPaymasterCallData(
  couponId: string,
  snapId?: string,
): Promise<PaymasterCallData> {
  return invokeSnap<PaymasterCallData>(
    'getPaymasterCallData',
    { couponId },
    snapId,
  );
}

/**
 * Show dialog for adding a coupon
 */
export async function showAddCouponDialog(
  snapId?: string,
): Promise<ShowAddCouponDialogResponse> {
  return invokeSnap<ShowAddCouponDialogResponse>(
    'showAddCouponDialog',
    undefined,
    snapId,
  );
}

/**
 * Show dialog listing all coupons
 */
export async function showCouponsList(
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('showCouponsList', undefined, snapId);
}

/**
 * Show details dialog for a specific coupon
 */
export async function showCouponDetails(
  couponId: string,
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('showCouponDetails', { couponId }, snapId);
}

/**
 * Clear all coupons
 * This requires user confirmation
 */
export async function clearAllCoupons(
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('clearCoupons', undefined, snapId);
}

/**
 * Parse a coupon code from testnet.prepaidgas.xyz
 *
 * TODO: Implement based on your actual coupon code format
 * This is a placeholder that expects a JSON string
 */
export function parseCouponCode(couponCode: string): AddCouponParams {
  try {
    // If the coupon code is JSON
    const parsed = JSON.parse(couponCode);

    return {
      paymasterContext: parsed.paymasterContext || parsed.context,
      paymasterAddress: parsed.paymasterAddress || parsed.address,
      poolType: parsed.poolType || 'multi-use',
      chainId: parsed.chainId || '11155111',
      network: parsed.network || 'sepolia',
      label: parsed.label,
    };
  } catch {
    // If it's not JSON, assume it's the raw paymaster context
    // and the dapp needs to provide other info
    throw new Error(
      'Unable to parse coupon code. Please provide additional information.',
    );
  }
}

/**
 * Complete workflow: Show dialog, parse code, and add coupon
 */
export async function addCouponWithDialog(
  snapId?: string,
): Promise<AddCouponResponse | null> {
  // Show the dialog
  const dialogResult = await showAddCouponDialog(snapId);

  if (!dialogResult.success || !dialogResult.couponCode) {
    return null;
  }

  try {
    // Parse the coupon code
    const couponParams = parseCouponCode(dialogResult.couponCode);

    // Add the coupon
    return await addCoupon(couponParams, snapId);
  } catch (error) {
    console.error('Failed to add coupon:', error);
    throw error;
  }
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown }) => Promise<any>;
    };
  }
}
 * Prepaid Gas Snap Client
 *
 * Helper utility for dapps to integrate with the Prepaid Gas Snap
 * This file can be used as a reference or copied into your dapp
 */

import type {
  AddCouponParams,
  GetCouponParams,
  RemoveCouponParams,
  PublicCouponData,
  PaymasterCallData,
  AddCouponResponse,
  ShowAddCouponDialogResponse,
  SuccessResponse,
} from './types';

// Default snap ID - update this when published to npm
const DEFAULT_SNAP_ID = 'npm:prepaidgas-snap';

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask);
}

/**
 * Check if the snap is installed and connected
 */
export async function isSnapInstalled(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    return false;
  }

  try {
    const snaps = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });
    return Object.keys(snaps).includes(snapId);
  } catch {
    return false;
  }
}

/**
 * Connect to the snap (install if not already installed)
 */
export async function connectSnap(
  snapId: string = DEFAULT_SNAP_ID,
): Promise<boolean> {
  if (!isMetaMaskInstalled()) {
    throw new Error(
      'MetaMask is not installed. Please install MetaMask Flask to use snaps.',
    );
  }

  try {
    await window.ethereum.request({
      method: 'wallet_requestSnaps',
      params: {
        [snapId]: {},
      },
    });
    return true;
  } catch (error) {
    console.error('Failed to connect to snap:', error);
    return false;
  }
}

/**
 * Invoke a snap method
 */
async function invokeSnap<T>(
  method: string,
  params?: unknown,
  snapId: string = DEFAULT_SNAP_ID,
): Promise<T> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId,
      request: {
        method,
        params,
      },
    },
  });

  return result as T;
}

/**
 * Add a new prepaid gas coupon
 */
export async function addCoupon(
  params: AddCouponParams,
  snapId?: string,
): Promise<AddCouponResponse> {
  return invokeSnap<AddCouponResponse>('addCoupon', params, snapId);
}

/**
 * Get a specific coupon by ID (without sensitive data)
 */
export async function getCoupon(
  couponId: string,
  snapId?: string,
): Promise<PublicCouponData> {
  return invokeSnap<PublicCouponData>('getCoupon', { couponId }, snapId);
}

/**
 * List all stored coupons (without sensitive data)
 */
export async function listCoupons(
  snapId?: string,
): Promise<PublicCouponData[]> {
  return invokeSnap<PublicCouponData[]>('listCoupons', undefined, snapId);
}

/**
 * Remove a coupon
 */
export async function removeCoupon(
  couponId: string,
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('removeCoupon', { couponId }, snapId);
}

/**
 * Get paymaster call data for a transaction
 * This requires user confirmation
 */
export async function getPaymasterCallData(
  couponId: string,
  snapId?: string,
): Promise<PaymasterCallData> {
  return invokeSnap<PaymasterCallData>(
    'getPaymasterCallData',
    { couponId },
    snapId,
  );
}

/**
 * Show dialog for adding a coupon
 */
export async function showAddCouponDialog(
  snapId?: string,
): Promise<ShowAddCouponDialogResponse> {
  return invokeSnap<ShowAddCouponDialogResponse>(
    'showAddCouponDialog',
    undefined,
    snapId,
  );
}

/**
 * Show dialog listing all coupons
 */
export async function showCouponsList(
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('showCouponsList', undefined, snapId);
}

/**
 * Show details dialog for a specific coupon
 */
export async function showCouponDetails(
  couponId: string,
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('showCouponDetails', { couponId }, snapId);
}

/**
 * Clear all coupons
 * This requires user confirmation
 */
export async function clearAllCoupons(
  snapId?: string,
): Promise<SuccessResponse> {
  return invokeSnap<SuccessResponse>('clearCoupons', undefined, snapId);
}

/**
 * Parse a coupon code from testnet.prepaidgas.xyz
 *
 * TODO: Implement based on your actual coupon code format
 * This is a placeholder that expects a JSON string
 */
export function parseCouponCode(couponCode: string): AddCouponParams {
  try {
    // If the coupon code is JSON
    const parsed = JSON.parse(couponCode);

    return {
      paymasterContext: parsed.paymasterContext || parsed.context,
      paymasterAddress: parsed.paymasterAddress || parsed.address,
      poolType: parsed.poolType || 'multi-use',
      chainId: parsed.chainId || '11155111',
      network: parsed.network || 'sepolia',
      label: parsed.label,
    };
  } catch {
    // If it's not JSON, assume it's the raw paymaster context
    // and the dapp needs to provide other info
    throw new Error(
      'Unable to parse coupon code. Please provide additional information.',
    );
  }
}

/**
 * Complete workflow: Show dialog, parse code, and add coupon
 */
export async function addCouponWithDialog(
  snapId?: string,
): Promise<AddCouponResponse | null> {
  // Show the dialog
  const dialogResult = await showAddCouponDialog(snapId);

  if (!dialogResult.success || !dialogResult.couponCode) {
    return null;
  }

  try {
    // Parse the coupon code
    const couponParams = parseCouponCode(dialogResult.couponCode);

    // Add the coupon
    return await addCoupon(couponParams, snapId);
  } catch (error) {
    console.error('Failed to add coupon:', error);
    throw error;
  }
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown }) => Promise<any>;
    };
  }
}
