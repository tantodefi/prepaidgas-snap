import type { OnRpcRequestHandler } from '@metamask/snaps-sdk';
import {
  Box,
  Text,
  Bold,
  Input,
  Heading,
  Divider,
  Copyable,
} from '@metamask/snaps-sdk/jsx';

// ============================================================================
// Types
// ============================================================================

/**
 * Stored coupon data structure
 */
type PrepaidCoupon = {
  id: string;
  paymasterAddress: string;
  paymasterContext: string;
  poolType: 'multi-use' | 'single-use' | 'cache-enabled';
  chainId: string;
  network: string;
  addedAt: string;
  label?: string;
};

/**
 * Snap state structure
 */
type SnapState = {
  coupons: PrepaidCoupon[];
};

/**
 * Request parameters for adding a coupon
 */
type AddCouponParams = {
  paymasterContext: string;
  paymasterAddress: string;
  poolType: 'multi-use' | 'single-use' | 'cache-enabled';
  chainId: string;
  network: string;
  label?: string;
};

/**
 * Request parameters for getting coupon data
 */
type GetCouponParams = {
  couponId: string;
};

/**
 * Request parameters for removing a coupon
 */
type RemoveCouponParams = {
  couponId: string;
};

/**
 * Paymaster call data structure
 */
type PaymasterCallData = {
  paymasterAddress: string;
  paymasterContext: string;
  poolType: string;
};

// ============================================================================
// State Management
// ============================================================================

/**
 * Get the current snap state
 */
async function getState(): Promise<SnapState> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  return state ?? { coupons: [] };
}

/**
 * Update the snap state
 */
async function setState(state: SnapState): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
}

// ============================================================================
// Coupon Management Functions
// ============================================================================

/**
 * Generate a unique coupon ID
 */
function generateCouponId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `PGC-${timestamp}-${randomPart}`;
}

/**
 * Validate paymaster context format
 */
function validatePaymasterContext(context: string): boolean {
  // Basic validation - should be a base64 or hex string
  if (!context || context.length < 10) {
    return false;
  }
  // Check if it's valid hex (0x prefix) or base64
  const isHex = /^0x[a-fA-F0-9]+$/.test(context);
  const isBase64 = /^[A-Za-z0-9+/=]+$/.test(context);
  return isHex || isBase64;
}

/**
 * Add a new coupon to storage
 */
async function addCoupon(params: AddCouponParams): Promise<PrepaidCoupon> {
  // Validate required parameters
  if (!params.paymasterContext || !params.paymasterAddress || !params.chainId) {
    throw new Error(
      'Missing required parameters: paymasterContext, paymasterAddress, or chainId',
    );
  }

  // Validate paymaster context
  if (!validatePaymasterContext(params.paymasterContext)) {
    throw new Error('Invalid paymaster context format');
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(params.paymasterAddress)) {
    throw new Error('Invalid paymaster address format');
  }

  const state = await getState();

  // Check if coupon already exists (by context)
  const existingCoupon = state.coupons.find(
    (c) => c.paymasterContext === params.paymasterContext,
  );

  if (existingCoupon) {
    throw new Error('This coupon has already been added');
  }

  const newCoupon: PrepaidCoupon = {
    id: generateCouponId(),
    paymasterAddress: params.paymasterAddress,
    paymasterContext: params.paymasterContext,
    poolType: params.poolType || 'multi-use',
    chainId: params.chainId,
    network: params.network || 'unknown',
    addedAt: new Date().toISOString(),
    label: params.label,
  };

  state.coupons.push(newCoupon);
  await setState(state);

  return newCoupon;
}

/**
 * Get all coupons
 */
async function listCoupons(): Promise<PrepaidCoupon[]> {
  const state = await getState();
  return state.coupons;
}

/**
 * Get a specific coupon by ID
 */
async function getCoupon(couponId: string): Promise<PrepaidCoupon | null> {
  const state = await getState();
  return state.coupons.find((c) => c.id === couponId) ?? null;
}

/**
 * Remove a coupon by ID
 */
async function removeCoupon(couponId: string): Promise<boolean> {
  const state = await getState();
  const initialLength = state.coupons.length;
  state.coupons = state.coupons.filter((c) => c.id !== couponId);

  if (state.coupons.length < initialLength) {
    await setState(state);
    return true;
  }

  return false;
}

/**
 * Clear all coupons
 */
async function clearAllCoupons(): Promise<void> {
  await setState({ coupons: [] });
}

// ============================================================================
// Paymaster Call Data Functions
// ============================================================================

/**
 * Get paymaster call data for a specific coupon
 * This is what dapps will use to construct gasless transactions
 */
async function getPaymasterCallData(
  couponId: string,
): Promise<PaymasterCallData> {
  const coupon = await getCoupon(couponId);

  if (!coupon) {
    throw new Error('Coupon not found');
  }

  return {
    paymasterAddress: coupon.paymasterAddress,
    paymasterContext: coupon.paymasterContext,
    poolType: coupon.poolType,
  };
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * Show the add coupon dialog
 */
async function showAddCouponDialog(origin: string): Promise<string | null> {
  const result = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'prompt',
      content: (
        <Box>
          <Heading>Add Prepaid Gas Coupon</Heading>
          <Text>
            Paste your prepaid gas coupon code from <Bold>{origin}</Bold>
          </Text>
          <Divider />
          <Text>
            This code contains your paymaster context and will be securely
            stored in your MetaMask Snap.
          </Text>
        </Box>
      ),
      placeholder: 'Paste your coupon code here...',
    },
  });

  return result;
}

/**
 * Show coupon details dialog
 */
async function showCouponDetailsDialog(coupon: PrepaidCoupon): Promise<void> {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: (
        <Box>
          <Heading>Prepaid Gas Coupon</Heading>
          <Divider />

          <Text>
            <Bold>ID:</Bold>
          </Text>
          <Text>{coupon.id}</Text>

          <Divider />

          <Text>
            <Bold>Type:</Bold> {coupon.poolType}
          </Text>
          <Text>
            <Bold>Network:</Bold> {coupon.network}
          </Text>
          <Text>
            <Bold>Chain ID:</Bold> {coupon.chainId}
          </Text>

          <Divider />

          <Text>
            <Bold>Paymaster Address:</Bold>
          </Text>
          <Copyable value={coupon.paymasterAddress} />

          <Divider />

          <Text>
            <Bold>Added:</Bold> {new Date(coupon.addedAt).toLocaleDateString()}
          </Text>
        </Box>
      ),
    },
  });
}

/**
 * Show list of all coupons
 */
async function showCouponsListDialog(): Promise<void> {
  const coupons = await listCoupons();

  if (coupons.length === 0) {
    await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'alert',
        content: (
          <Box>
            <Heading>Your Prepaid Gas Coupons</Heading>
            <Divider />
            <Text>You don't have any coupons yet.</Text>
            <Text>
              Get prepaid gas credits from testnet.prepaidgas.xyz and add them
              here!
            </Text>
          </Box>
        ),
      },
    });
    return;
  }

  const content = (
    <Box>
      <Heading>Your Prepaid Gas Coupons ({coupons.length})</Heading>
      <Divider />
      {coupons.map((coupon) => (
        <>
          <Box>
            <Text>
              <Bold>{coupon.label || coupon.id}</Bold>
            </Text>
            <Text>Type: {coupon.poolType}</Text>
            <Text>Network: {coupon.network}</Text>
            <Text>Added: {new Date(coupon.addedAt).toLocaleDateString()}</Text>
          </Box>
          <Divider />
        </>
      ))}
    </Box>
  );

  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content,
    },
  });
}

// ============================================================================
// RPC Request Handler
// ============================================================================

/**
 * Handle incoming JSON-RPC requests from dapps
 *
 * Available methods:
 * - addCoupon: Add a new prepaid gas coupon
 * - getCoupon: Get a specific coupon by ID
 * - listCoupons: List all stored coupons
 * - removeCoupon: Remove a coupon by ID
 * - getPaymasterCallData: Get paymaster data for transactions
 * - showCouponDialog: Show UI for adding a coupon
 * - showCouponsList: Show UI listing all coupons
 * - clearCoupons: Clear all coupons (admin function)
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  switch (request.method) {
    // ========================================================================
    // Coupon Management Methods
    // ========================================================================

    case 'addCoupon': {
      const params = request.params as AddCouponParams;

      // Show confirmation dialog
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Add Prepaid Gas Coupon</Heading>
              <Text>
                <Bold>{origin}</Bold> wants to add a prepaid gas coupon.
              </Text>
              <Divider />
              <Text>
                <Bold>Network:</Bold> {params.network || 'Unknown'}
              </Text>
              <Text>
                <Bold>Type:</Bold> {params.poolType}
              </Text>
              <Divider />
              <Text>
                This will allow the dapp to use your prepaid gas credits for
                gasless transactions.
              </Text>
            </Box>
          ),
        },
      });

      if (!confirmed) {
        throw new Error('User rejected the request');
      }

      const coupon = await addCoupon(params);
      return {
        success: true,
        coupon: {
          id: coupon.id,
          poolType: coupon.poolType,
          network: coupon.network,
          chainId: coupon.chainId,
        },
      };
    }

    case 'getCoupon': {
      const { couponId } = request.params as GetCouponParams;
      const coupon = await getCoupon(couponId);

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Return coupon without sensitive context data (use getPaymasterCallData for that)
      return {
        id: coupon.id,
        paymasterAddress: coupon.paymasterAddress,
        poolType: coupon.poolType,
        chainId: coupon.chainId,
        network: coupon.network,
        addedAt: coupon.addedAt,
        label: coupon.label,
      };
    }

    case 'listCoupons': {
      const coupons = await listCoupons();

      // Return coupons without sensitive context data
      return coupons.map((coupon) => ({
        id: coupon.id,
        paymasterAddress: coupon.paymasterAddress,
        poolType: coupon.poolType,
        chainId: coupon.chainId,
        network: coupon.network,
        addedAt: coupon.addedAt,
        label: coupon.label,
      }));
    }

    case 'removeCoupon': {
      const { couponId } = request.params as RemoveCouponParams;

      // Show confirmation dialog
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Remove Coupon</Heading>
              <Text>
                Are you sure you want to remove this prepaid gas coupon?
              </Text>
              <Text>
                <Bold>Coupon ID:</Bold> {couponId}
              </Text>
              <Divider />
              <Text>This action cannot be undone.</Text>
            </Box>
          ),
        },
      });

      if (!confirmed) {
        return { success: false, message: 'User rejected the request' };
      }

      const removed = await removeCoupon(couponId);
      return { success: removed };
    }

    // ========================================================================
    // Paymaster Integration Methods
    // ========================================================================

    case 'getPaymasterCallData': {
      const { couponId } = request.params as GetCouponParams;

      // Show confirmation dialog for security
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Use Prepaid Gas</Heading>
              <Text>
                <Bold>{origin}</Bold> wants to use your prepaid gas coupon for a
                transaction.
              </Text>
              <Divider />
              <Text>
                This will provide the paymaster data to enable gasless
                transactions.
              </Text>
            </Box>
          ),
        },
      });

      if (!confirmed) {
        throw new Error('User rejected the request');
      }

      return await getPaymasterCallData(couponId);
    }

    // ========================================================================
    // UI Methods
    // ========================================================================

    case 'showAddCouponDialog': {
      const couponCode = await showAddCouponDialog(origin);

      if (!couponCode) {
        return { success: false, message: 'User cancelled' };
      }

      // TODO: Parse the coupon code and extract necessary data
      // For now, return the raw code for the dapp to handle
      return { success: true, couponCode };
    }

    case 'showCouponsList': {
      await showCouponsListDialog();
      return { success: true };
    }

    case 'showCouponDetails': {
      const { couponId } = request.params as GetCouponParams;
      const coupon = await getCoupon(couponId);

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      await showCouponDetailsDialog(coupon);
      return { success: true };
    }

    // ========================================================================
    // Admin Methods
    // ========================================================================

    case 'clearCoupons': {
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Clear All Coupons</Heading>
              <Text>
                Are you sure you want to remove ALL prepaid gas coupons?
              </Text>
              <Divider />
              <Text>
                This action cannot be undone and you will lose access to all
                your prepaid gas credits.
              </Text>
            </Box>
          ),
        },
      });

      if (!confirmed) {
        return { success: false, message: 'User rejected the request' };
      }

      await clearAllCoupons();
      return { success: true };
    }

    // ========================================================================
    // Default/Legacy Methods
    // ========================================================================

    case 'hello': {
      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: (
            <Box>
              <Heading>Prepaid Gas Manager</Heading>
              <Text>
                Hello, <Bold>{origin}</Bold>!
              </Text>
              <Divider />
              <Text>
                This snap helps you manage prepaid gas coupons and enable
                gasless transactions.
              </Text>
              <Text>
                Get started by purchasing gas credits at testnet.prepaidgas.xyz
              </Text>
            </Box>
          ),
        },
      });
    }

    default:
      throw new Error(`Method not found: ${request.method}`);
  }
};
