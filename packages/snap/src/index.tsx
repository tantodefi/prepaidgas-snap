import type {
  OnRpcRequestHandler,
  OnHomePageHandler,
  OnUserInputHandler,
} from '@metamask/snaps-sdk';
import {
  Box,
  Text,
  Bold,
  Input,
  Heading,
  Divider,
  Copyable,
  Form,
  Field,
  Button,
  Banner,
  Row,
  Value,
  Section,
  Dropdown,
  Option,
  Spinner,
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
 * Show the add coupon dialog (simple single input)
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
 * Show enhanced multi-step form for adding coupon
 * Uses advanced MetaMask Snap UI components per docs.metamask.io/snaps/features/custom-ui
 */
async function showAddCouponFormDialog(
  origin: string,
): Promise<PrepaidCoupon | null> {
  // Step 1: Choose mode with Banner
  const mode = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Heading>Add Prepaid Gas Coupon</Heading>
          <Banner severity="info" title="Configure Your Paymaster">
            <Text>Choose how to add your gas card from {origin}</Text>
          </Banner>
          <Divider />
          <Section>
            <Row label="Quick Mode">
              <Text>Paste complete gas card context</Text>
            </Row>
            <Row label="Manual Mode">
              <Text>Enter each field individually</Text>
            </Row>
          </Section>
          <Divider />
          <Text>
            <Bold>Approve</Bold> = Quick Mode (Recommended) •{' '}
            <Bold>Reject</Bold> = Manual Mode
          </Text>
        </Box>
      ),
    },
  });

  // Quick mode - just paste the code
  if (mode) {
    const couponCode = await snap.request({
      method: 'snap_dialog',
      params: {
        type: 'prompt',
        content: (
          <Box>
            <Heading>📋 Paste Gas Card Context</Heading>
            <Banner severity="info" title="Quick Configure">
              <Text>
                Paste the complete code from your testnet.prepaidgas.xyz receipt
              </Text>
            </Banner>
            <Divider />
            <Text>
              The code includes your paymaster address, context, and pool
              details.
            </Text>
          </Box>
        ),
        placeholder: 'Paste gas card context here...',
      },
    });

    if (!couponCode) return null;

    // Try to parse it
    try {
      const parsed = JSON.parse(couponCode);

      // Ask for optional label
      const label = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'prompt',
          content: (
            <Box>
              <Heading>Label Your Coupon</Heading>
              <Text>Give this coupon a friendly name (optional)</Text>
            </Box>
          ),
          placeholder: 'e.g., My Gas Card',
        },
      });

      const newCoupon = await addCoupon({
        paymasterContext: parsed.paymasterContext || parsed.context,
        paymasterAddress: parsed.paymasterAddress || parsed.address,
        poolType: parsed.poolType || 'multi-use',
        chainId: parsed.chainId || '11155111',
        network: parsed.network || 'sepolia',
        label: label || undefined,
      });

      // Show success banner with details
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: (
            <Box>
              <Banner severity="success" title="✓ Coupon Added Successfully!">
                <Text>Your prepaid gas coupon is ready to use</Text>
              </Banner>
              <Divider />
              <Section>
                <Row label="Coupon ID">
                  <Value value={newCoupon.id} />
                </Row>
                <Row label="Type">
                  <Value value={newCoupon.poolType} />
                </Row>
                <Row label="Network">
                  <Value value={newCoupon.network} />
                </Row>
              </Section>
            </Box>
          ),
        },
      });

      return newCoupon;
    } catch {
      // If parsing fails
      await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: (
            <Box>
              <Banner severity="warning" title="Unable to Parse">
                <Text>
                  Could not parse the coupon code. Please try manual mode or
                  check the format.
                </Text>
              </Banner>
            </Box>
          ),
        },
      });
      return null;
    }
  }

  // Manual mode - step by step with progress indicators
  const paymasterContext = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'prompt',
      content: (
        <Box>
          <Heading>⚙️ Manual Configuration</Heading>
          <Text>
            <Bold>Step 1 of 5:</Bold> Paymaster Context
          </Text>
          <Divider />
          <Text>
            Enter the paymaster context (hex or base64 encoded string)
          </Text>
        </Box>
      ),
      placeholder: '0x...',
    },
  });

  if (!paymasterContext) return null;

  const paymasterAddress = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'prompt',
      content: (
        <Box>
          <Heading>⚙️ Manual Configuration</Heading>
          <Text>
            <Bold>Step 2 of 5:</Bold> Paymaster Address
          </Text>
          <Divider />
          <Text>Enter the paymaster contract address</Text>
        </Box>
      ),
      placeholder: '0x...',
    },
  });

  if (!paymasterAddress) return null;

  // Pool type - with visual explanation
  const isMultiUse = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'confirmation',
      content: (
        <Box>
          <Heading>⚙️ Manual Configuration</Heading>
          <Text>
            <Bold>Step 3 of 5:</Bold> Pool Type
          </Text>
          <Divider />
          <Section>
            <Row label="Multi-Use">
              <Text>Use for multiple transactions</Text>
            </Row>
            <Row label="Single-Use">
              <Text>One-time voucher</Text>
            </Row>
          </Section>
          <Divider />
          <Text>
            <Bold>Approve</Bold> = Multi-Use • <Bold>Reject</Bold> = Single-Use
          </Text>
        </Box>
      ),
    },
  });

  const network = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'prompt',
      content: (
        <Box>
          <Heading>⚙️ Manual Configuration</Heading>
          <Text>
            <Bold>Step 4 of 5:</Bold> Network
          </Text>
          <Divider />
          <Text>Enter the network name (e.g., sepolia, mainnet)</Text>
        </Box>
      ),
      placeholder: 'sepolia',
    },
  });

  const label = await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'prompt',
      content: (
        <Box>
          <Heading>⚙️ Manual Configuration</Heading>
          <Text>
            <Bold>Step 5 of 5:</Bold> Label (Optional)
          </Text>
          <Divider />
          <Text>Give this coupon a friendly name for easy identification</Text>
        </Box>
      ),
      placeholder: 'My Gas Card',
    },
  });

  const newCoupon = await addCoupon({
    paymasterContext,
    paymasterAddress,
    poolType: isMultiUse ? 'multi-use' : 'single-use',
    chainId: '11155111',
    network: network || 'sepolia',
    label: label || undefined,
  });

  // Show success with detailed info
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: (
        <Box>
          <Banner severity="success" title="✓ Coupon Added Successfully!">
            <Text>Your prepaid gas coupon is ready to use</Text>
          </Banner>
          <Divider />
          <Section>
            <Row label="Coupon ID">
              <Value value={newCoupon.id} />
            </Row>
            <Row label="Type">
              <Value value={newCoupon.poolType} />
            </Row>
            <Row label="Network">
              <Value value={newCoupon.network} />
            </Row>
            <Row label="Paymaster">
              <Value
                value={`${newCoupon.paymasterAddress.slice(0, 6)}...${newCoupon.paymasterAddress.slice(-4)}`}
              />
            </Row>
          </Section>
        </Box>
      ),
    },
  });

  return newCoupon;
}

/**
 * Show coupon details dialog with enhanced UI
 */
async function showCouponDetailsDialog(coupon: PrepaidCoupon): Promise<void> {
  await snap.request({
    method: 'snap_dialog',
    params: {
      type: 'alert',
      content: (
        <Box>
          <Heading>💳 {coupon.label || 'Prepaid Gas Coupon'}</Heading>
          <Divider />

          <Section>
            <Row label="Coupon ID">
              <Value value={coupon.id} />
            </Row>
            <Row label="Pool Type">
              <Value value={coupon.poolType} />
            </Row>
            <Row label="Network">
              <Value value={coupon.network} />
            </Row>
            <Row label="Chain ID">
              <Value value={coupon.chainId} />
            </Row>
          </Section>

          <Divider />

          <Text>
            <Bold>Paymaster Contract</Bold>
          </Text>
          <Copyable value={coupon.paymasterAddress} />

          <Divider />

          <Row label="Added">
            <Text>{new Date(coupon.addedAt).toLocaleDateString()}</Text>
          </Row>
        </Box>
      ),
    },
  });
}

/**
 * Show list of all coupons with enhanced UI
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
            <Banner severity="warning" title="No Coupons Yet">
              <Text>
                Get prepaid gas credits from testnet.prepaidgas.xyz and add them
                here!
              </Text>
            </Banner>
          </Box>
        ),
      },
    });
    return;
  }

  const content = (
    <Box>
      <Heading>💳 Your Gas Coupons</Heading>
      <Banner
        severity="success"
        title={`${coupons.length} Coupon${coupons.length > 1 ? 's' : ''} Available`}
      >
        <Text>Manage your prepaid gas credits below</Text>
      </Banner>
      <Divider />
      {coupons.map((coupon) => (
        <Box key={coupon.id}>
          <Section>
            <Heading>{coupon.label || coupon.id}</Heading>
            <Row label="Type">
              <Value value={coupon.poolType} />
            </Row>
            <Row label="Network">
              <Value value={coupon.network} />
            </Row>
            <Row label="Added">
              <Value value={new Date(coupon.addedAt).toLocaleDateString()} />
            </Row>
          </Section>
          <Divider />
        </Box>
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

      // Show confirmation dialog with enhanced UI
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>Add Prepaid Gas Coupon</Heading>
              <Banner severity="info" title="Permission Request">
                <Text>
                  <Bold>{origin}</Bold> wants to add a prepaid gas coupon
                </Text>
              </Banner>
              <Divider />
              <Section>
                <Row label="Network">
                  <Value value={params.network || 'Unknown'} />
                </Row>
                <Row label="Pool Type">
                  <Value value={params.poolType} />
                </Row>
                <Row label="Paymaster">
                  <Value
                    value={`${params.paymasterAddress.slice(0, 6)}...${params.paymasterAddress.slice(-4)}`}
                  />
                </Row>
              </Section>
              <Divider />
              <Banner severity="warning" title="Enable Gasless Transactions">
                <Text>
                  This will allow the dapp to use your prepaid gas credits.
                </Text>
              </Banner>
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
      const coupon = await getCoupon(couponId);

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Show confirmation dialog with coupon details
      const confirmed = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: (
            <Box>
              <Heading>💸 Use Prepaid Gas</Heading>
              <Banner severity="info" title="Transaction Request">
                <Text>
                  <Bold>{origin}</Bold> wants to use your prepaid gas for a
                  gasless transaction
                </Text>
              </Banner>
              <Divider />
              <Section>
                <Row label="Using Coupon">
                  <Value value={coupon.label || coupon.id} />
                </Row>
                <Row label="Pool Type">
                  <Value value={coupon.poolType} />
                </Row>
                <Row label="Network">
                  <Value value={coupon.network} />
                </Row>
              </Section>
              <Divider />
              <Text>
                This will provide your paymaster context to enable the gasless
                transaction.
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

    case 'showAddCouponForm': {
      // Show interactive form with snap_createInterface
      const interfaceId = await snap.request({
        method: 'snap_createInterface',
        params: {
          ui: (
            <Box>
              <Heading>Add Prepaid Gas Coupon</Heading>
              <Banner severity="info" title="Quick Configure">
                <Text>
                  Paste your gas card context from testnet.prepaidgas.xyz
                </Text>
              </Banner>
              <Form name="addCouponForm">
                <Field label="Gas Card Context">
                  <Input
                    name="couponCode"
                    placeholder="Paste your complete gas card context here..."
                  />
                </Field>
                <Field label="Label (Optional)">
                  <Input name="label" placeholder="e.g., My Gas Card" />
                </Field>
                <Button type="submit" name="submit">
                  Configure
                </Button>
              </Form>
            </Box>
          ),
          context: { action: 'addCoupon', origin },
        },
      });

      const result = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          id: interfaceId,
        },
      });

      return { success: true, result };
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

// ============================================================================
// Home Page Handler
// ============================================================================

/**
 * Show the snap's home page in MetaMask with interactive form
 * Users can access this from: MetaMask → Snaps → Prepaid Gas Manager → View
 */
export const onHomePage: OnHomePageHandler = async () => {
  const coupons = await listCoupons();
  const hasCoupons = coupons.length > 0;

  // Build coupon list content
  const couponListContent = hasCoupons
    ? (
        <Box>
          <Divider />
          <Text>
            <Bold>Your Coupons:</Bold>
          </Text>
          <Text>• {coupons[0].label || coupons[0].id}</Text>
          <Text>  {coupons[0].poolType} on {coupons[0].network}</Text>
          {coupons.length > 1 ? (
            <Text>• {coupons[1].label || coupons[1].id}</Text>
          ) : null}
          {coupons.length > 1 ? (
            <Text>  {coupons[1].poolType} on {coupons[1].network}</Text>
          ) : null}
          {coupons.length > 2 ? (
            <Text>... and {coupons.length - 2} more</Text>
          ) : null}
        </Box>
      )
    : null;

  return {
    content: (
      <Box>
        <Heading>💳 Prepaid Gas Manager</Heading>
        <Text>Manage prepaid gas coupons for gasless transactions</Text>
        <Divider />

        <Text>
          <Bold>Status:</Bold> {hasCoupons ? `${coupons.length} coupon(s)` : 'No coupons yet'}
        </Text>

        <Divider />

        <Text>
          <Bold>Add Coupon:</Bold>
        </Text>

        <Form name="addCouponFormHome">
          <Field label="Gas Card Context">
            <Input
              name="couponCode"
              placeholder="Paste gas card context from testnet.prepaidgas.xyz"
            />
          </Field>
          <Field label="Label">
            <Input name="label" placeholder="My Gas Card" />
          </Field>
          <Button type="submit" name="submitCoupon">
            Add Coupon
          </Button>
        </Form>

        {couponListContent}

        <Divider />
        <Text color="muted">Get credits from testnet.prepaidgas.xyz</Text>
      </Box>
    ),
  };
};

// ============================================================================
// User Input Handler (for Interactive UI)
// ============================================================================

/**
 * Handle user input from interactive forms
 * This is called when users interact with Form/Button/Input components
 */
export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
  console.log('📥 User input received:', { id, event });

  // Handle form submission from home page
  if (event.type === 'FormSubmitEvent' && event.name === 'addCouponFormHome') {
    const formData = event.value as Record<string, string>;
    const couponCode = formData.couponCode || '';
    const label = formData.label || '';

    console.log('Form data:', { couponCode, label });

    if (!couponCode || couponCode.trim() === '') {
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Banner severity="warning" title="Missing Input">
                <Text>Please enter your gas card context</Text>
              </Banner>
            </Box>
          ),
        },
      });
      return;
    }

    try {
      // Show loading
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Heading>Adding Coupon...</Heading>
              <Spinner />
              <Text>Please wait while we configure your paymaster</Text>
            </Box>
          ),
        },
      });

      // Parse the coupon code
      let paymasterContext = '';
      let paymasterAddress = '';
      let poolType: 'multi-use' | 'single-use' | 'cache-enabled' = 'multi-use';
      let network = 'sepolia';
      let chainId = '11155111';

      try {
        const parsed = JSON.parse(couponCode);
        console.log('✓ Parsed JSON:', parsed);
        paymasterContext = parsed.paymasterContext || parsed.context;
        paymasterAddress = parsed.paymasterAddress || parsed.address;
        poolType = parsed.poolType || 'multi-use';
        network = parsed.network || 'sepolia';
        chainId = parsed.chainId || '11155111';
      } catch (parseError) {
        // If not JSON, check if it's hex-encoded paymasterAndData
        console.log('⚠️ Not JSON, parsing as hex data');

        if (couponCode.startsWith('0x') && couponCode.length >= 42) {
          // Extract paymaster address from hex (first 20 bytes after 0x)
          paymasterAddress = '0x' + couponCode.slice(26, 66);
          paymasterContext = couponCode; // Use full hex as context
          console.log('✓ Extracted from hex - Address:', paymasterAddress);
        } else {
          // Fallback
          console.log('Using as raw paymaster context');
          paymasterContext = couponCode;
          paymasterAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        }
      }

      console.log('Attempting to add coupon with:', {
        paymasterContext: paymasterContext.slice(0, 20) + '...',
        paymasterAddress,
        poolType,
        network,
      });

      // Add the coupon
      const newCoupon = await addCoupon({
        paymasterContext,
        paymasterAddress,
        poolType,
        chainId,
        network,
        label: label || undefined,
      });

      console.log('✓ Coupon added successfully:', newCoupon.id);

      // Update UI to show success (simplified to avoid type errors)
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Banner severity="success" title="✓ Coupon Added Successfully!">
                <Text>Your prepaid gas coupon has been configured</Text>
              </Banner>
              <Divider />
              <Text>
                <Bold>Coupon ID:</Bold> {newCoupon.id}
              </Text>
              <Text>
                <Bold>Type:</Bold> {newCoupon.poolType}
              </Text>
              <Text>
                <Bold>Network:</Bold> {newCoupon.network}
              </Text>
              <Divider />
              <Text>
                ✓ Close and reopen this page to see your coupon in the list!
              </Text>
            </Box>
          ),
        },
      });
    } catch (error) {
      console.error('❌ Error adding coupon:', error);
      await snap.request({
        method: 'snap_updateInterface',
        params: {
          id,
          ui: (
            <Box>
              <Banner severity="danger" title="Error">
                <Text>
                  {error instanceof Error
                    ? error.message
                    : 'Failed to add coupon'}
                </Text>
              </Banner>
              <Divider />
              <Text>Please check your coupon code and try again</Text>
            </Box>
          ),
        },
      });
    }
  }
};
