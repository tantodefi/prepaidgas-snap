/**
 * Type definitions for the Prepaid Gas Snap
 *
 * These types can be imported by dapps integrating with the snap
 */

/**
 * Supported pool/coupon types
 */
export type PoolType = 'multi-use' | 'single-use' | 'cache-enabled';

/**
 * Stored coupon data structure (internal)
 */
export type PrepaidCoupon = {
  id: string;
  paymasterAddress: string;
  paymasterContext: string;
  poolType: PoolType;
  chainId: string;
  network: string;
  addedAt: string;
  label?: string;
};

/**
 * Public coupon data (without sensitive context)
 */
export type PublicCouponData = Omit<PrepaidCoupon, 'paymasterContext'>;

/**
 * Snap state structure
 */
export type SnapState = {
  coupons: PrepaidCoupon[];
};

/**
 * Parameters for addCoupon method
 */
export type AddCouponParams = {
  paymasterContext: string;
  paymasterAddress: string;
  poolType: PoolType;
  chainId: string;
  network: string;
  label?: string;
};

/**
 * Parameters for getCoupon/getPaymasterCallData/showCouponDetails methods
 */
export type GetCouponParams = {
  couponId: string;
};

/**
 * Parameters for removeCoupon method
 */
export type RemoveCouponParams = {
  couponId: string;
};

/**
 * Paymaster call data for transaction construction
 */
export type PaymasterCallData = {
  paymasterAddress: string;
  paymasterContext: string;
  poolType: string;
};

/**
 * Response from addCoupon method
 */
export type AddCouponResponse = {
  success: boolean;
  coupon: {
    id: string;
    poolType: string;
    network: string;
    chainId: string;
  };
};

/**
 * Response from showAddCouponDialog method
 */
export type ShowAddCouponDialogResponse = {
  success: boolean;
  couponCode?: string;
  message?: string;
};

/**
 * Generic success response
 */
export type SuccessResponse = {
  success: boolean;
  message?: string;
};

/**
 * All available RPC methods
 */
export type SnapMethod =
  | 'addCoupon'
  | 'getCoupon'
  | 'listCoupons'
  | 'removeCoupon'
  | 'getPaymasterCallData'
  | 'showAddCouponDialog'
  | 'showCouponsList'
  | 'showCouponDetails'
  | 'clearCoupons'
  | 'hello';

/**
 * Helper type for snap requests
 */
export type SnapRequest<M extends SnapMethod, P = unknown> = {
  method: M;
  params?: P;
};
 * Type definitions for the Prepaid Gas Snap
 *
 * These types can be imported by dapps integrating with the snap
 */

/**
 * Supported pool/coupon types
 */
export type PoolType = 'multi-use' | 'single-use' | 'cache-enabled';

/**
 * Stored coupon data structure (internal)
 */
export type PrepaidCoupon = {
  id: string;
  paymasterAddress: string;
  paymasterContext: string;
  poolType: PoolType;
  chainId: string;
  network: string;
  addedAt: string;
  label?: string;
};

/**
 * Public coupon data (without sensitive context)
 */
export type PublicCouponData = Omit<PrepaidCoupon, 'paymasterContext'>;

/**
 * Snap state structure
 */
export type SnapState = {
  coupons: PrepaidCoupon[];
};

/**
 * Parameters for addCoupon method
 */
export type AddCouponParams = {
  paymasterContext: string;
  paymasterAddress: string;
  poolType: PoolType;
  chainId: string;
  network: string;
  label?: string;
};

/**
 * Parameters for getCoupon/getPaymasterCallData/showCouponDetails methods
 */
export type GetCouponParams = {
  couponId: string;
};

/**
 * Parameters for removeCoupon method
 */
export type RemoveCouponParams = {
  couponId: string;
};

/**
 * Paymaster call data for transaction construction
 */
export type PaymasterCallData = {
  paymasterAddress: string;
  paymasterContext: string;
  poolType: string;
};

/**
 * Response from addCoupon method
 */
export type AddCouponResponse = {
  success: boolean;
  coupon: {
    id: string;
    poolType: string;
    network: string;
    chainId: string;
  };
};

/**
 * Response from showAddCouponDialog method
 */
export type ShowAddCouponDialogResponse = {
  success: boolean;
  couponCode?: string;
  message?: string;
};

/**
 * Generic success response
 */
export type SuccessResponse = {
  success: boolean;
  message?: string;
};

/**
 * All available RPC methods
 */
export type SnapMethod =
  | 'addCoupon'
  | 'getCoupon'
  | 'listCoupons'
  | 'removeCoupon'
  | 'getPaymasterCallData'
  | 'showAddCouponDialog'
  | 'showCouponsList'
  | 'showCouponDetails'
  | 'clearCoupons'
  | 'hello';

/**
 * Helper type for snap requests
 */
export type SnapRequest<M extends SnapMethod, P = unknown> = {
  method: M;
  params?: P;
};
