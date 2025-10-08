# Prepaid Gas Snap

A MetaMask Snap for managing prepaid gas coupons and enabling gasless transactions via paymaster integration with testnet.prepaidgas.xyz.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  Your Website (testnet.prepaidgas.xyz / demo.prepaidgas.xyz)   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Your React Components (with /packages/ui styles)         │  │
│  │  - SnapStatusIndicator (✓ Configured / ❌ Required)       │  │
│  │  - SnapConfigDialog (Full UI for configuration)           │  │
│  │  - usePrepaidSnap() hook (State management)               │  │
│  └───────────────────┬───────────────────────────────────────┘  │
│                      │ JSON-RPC Calls                            │
└──────────────────────┼───────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│            MetaMask Snap (Inside MetaMask Flask)                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Simple Dialogs (MetaMask JSX components only)            │  │
│  │  - Confirmation dialogs                                   │  │
│  │  - Input prompts                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Secure Storage (Encrypted by MetaMask)                   │  │
│  │  - Paymaster addresses                                    │  │
│  │  - Paymaster contexts (Semaphore proofs)                  │  │
│  │  - Pool types and metadata                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  API Methods                                              │  │
│  │  - addCoupon() - Store new coupon                         │  │
│  │  - listCoupons() - Get all coupons                        │  │
│  │  - getPaymasterCallData() - Get paymaster for transaction │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points:**

- 🎨 **Your website** uses your full UI components from `/packages/ui`
- 🔐 **The snap** securely stores sensitive coupon data inside MetaMask
- 🔌 **Integration** via simple JSON-RPC calls using React hook
- ✅ **Status indicators** show "✓ Configured" or "❌ Required" in your website UI
- 🎯 **Snap's UI** is minimal (just confirmation dialogs) - all rich UI is in your website

## Quick Start

```bash
# Install dependencies
cd packages/prepaidgas-snap
yarn install

# Start both snap and companion site
yarn start

# This starts:
# - Snap at http://localhost:8080 (auto-builds on changes)
# - Companion site at http://localhost:8000 (with full UI)
```

**Then:**

1. Open **http://localhost:8000** in your browser
2. Follow the 3-step flow:
   - **Step 1:** Install MetaMask Flask (if needed)
   - **Step 2:** Connect to Snap → You'll see "✓ Snap Connected"
   - **Step 3:** Paste your coupon code → Click "Add Coupon"

**Super Simple!** Just:

1. Copy the coupon code from testnet.prepaidgas.xyz (from your card receipt)
2. Click the 📋 Paste button (or paste manually)
3. Click "✓ Add Coupon"

**Advanced Mode** available if you need to enter individual fields manually.

The companion site is **completely self-contained** - no dependencies on the main monorepo!

## Features

- 🔐 **Secure Storage**: Encrypted coupon storage in snap state
- 🎫 **Coupon Management**: Add, list, view, and remove coupons
- 💸 **Paymaster Integration**: Provide paymaster data for gasless transactions
- 🎨 **Built-in UI**: Custom dialogs for user interactions
- 🔒 **User Consent**: All sensitive operations require approval

## Installation for Users

1. Install [MetaMask Flask](https://metamask.io/flask/)
2. Visit a dapp integrated with Prepaid Gas Snap
3. Approve snap installation when prompted

## API Methods

### Coupon Management

#### `addCoupon`

Add a prepaid gas coupon (requires confirmation).

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: {
      method: 'addCoupon',
      params: {
        paymasterContext: '0x...',
        paymasterAddress: '0x...',
        poolType: 'multi-use', // 'single-use' | 'cache-enabled'
        chainId: '11155111',
        network: 'sepolia',
        label: 'My Coupon', // optional
      },
    },
  },
});
```

#### `listCoupons`

Get all stored coupons (without sensitive data).

```javascript
const coupons = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: { method: 'listCoupons' },
  },
});
// Returns: [{ id, paymasterAddress, poolType, chainId, network, addedAt, label }]
```

#### `getCoupon`

Get specific coupon details.

```javascript
const coupon = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: {
      method: 'getCoupon',
      params: { couponId: 'PGC-...' },
    },
  },
});
```

#### `removeCoupon`

Remove a coupon (requires confirmation).

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: {
      method: 'removeCoupon',
      params: { couponId: 'PGC-...' },
    },
  },
});
```

### Paymaster Integration

#### `getPaymasterCallData`

Get paymaster data for transaction (requires confirmation).

```javascript
const paymasterData = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: {
      method: 'getPaymasterCallData',
      params: { couponId: 'PGC-...' },
    },
  },
});
// Returns: { paymasterAddress, paymasterContext, poolType }
```

### UI Methods

#### `showAddCouponDialog`

Show dialog for user to paste coupon code.

```javascript
const result = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: { method: 'showAddCouponDialog' },
  },
});
// Returns: { success, couponCode? }
```

#### `showCouponsList`

Show dialog listing all coupons.

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: { method: 'showCouponsList' },
  },
});
```

#### `showCouponDetails`

Show details for a specific coupon.

```javascript
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'npm:prepaidgas-snap',
    request: {
      method: 'showCouponDetails',
      params: { couponId: 'PGC-...' },
    },
  },
});
```

## Integration with Dapps

### Using Helper Functions

Copy `packages/snap/src/snap-client.ts` to your project for easier integration:

```typescript
import {
  connectSnap,
  addCoupon,
  listCoupons,
  getPaymasterCallData,
} from './snap-client';

// Connect
await connectSnap();

// Add coupon
await addCoupon({
  paymasterContext: '0x...',
  paymasterAddress: '0x...',
  poolType: 'multi-use',
  chainId: '11155111',
  network: 'sepolia',
});

// List coupons
const coupons = await listCoupons();

// Get paymaster data for transaction
const paymaster = await getPaymasterCallData(coupons[0].id);
```

### React Component Example

```tsx
import { useState, useEffect } from 'react';
import { connectSnap, listCoupons, addCouponWithDialog } from './snap-client';

export function PrepaidGasManager() {
  const [coupons, setCoupons] = useState([]);
  const [connected, setConnected] = useState(false);

  async function handleConnect() {
    const success = await connectSnap();
    setConnected(success);
    if (success) loadCoupons();
  }

  async function loadCoupons() {
    const list = await listCoupons();
    setCoupons(list);
  }

  async function handleAddCoupon() {
    const result = await addCouponWithDialog();
    if (result) {
      alert('Coupon added!');
      loadCoupons();
    }
  }

  if (!connected) {
    return <button onClick={handleConnect}>Connect Snap</button>;
  }

  return (
    <div>
      <button onClick={handleAddCoupon}>Add Coupon</button>
      <ul>
        {coupons.map((c) => (
          <li key={c.id}>
            {c.label || c.id} - {c.network}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Using with Transactions

```javascript
// Get paymaster data
const paymasterData = await getPaymasterCallData(selectedCouponId);

// Use in your transaction
// (exact format depends on your paymaster implementation)
const tx = {
  to: recipientAddress,
  data: callData,
  // Add paymaster fields per your implementation
  paymasterAndData: encodePaymaster(
    paymasterData.paymasterAddress,
    paymasterData.paymasterContext,
  ),
};

await signer.sendTransaction(tx);
```

## Integration with Your Website

### Option 1: Using React Hook (Recommended)

The hook provides complete snap integration with state management:

```tsx
// 1. Copy hook to your project
// apps/web/hooks/snap/use-prepaid-snap.ts

// 2. Use in your component
import { usePrepaidSnap } from '@/hooks/snap/use-prepaid-snap';
import { SnapStatusIndicator } from '@/components/features/snap/snap-status-indicator';
import { SnapConfigDialog } from '@/components/features/snap/snap-config-dialog';

function MyApp() {
  const {
    isInstalled,
    isConfigured,
    selectedCoupon,
    getPaymasterData,
    connectSnap,
  } = usePrepaidSnap();

  const [showConfig, setShowConfig] = useState(false);

  const handleTransaction = async () => {
    if (!isConfigured) {
      setShowConfig(true);
      return;
    }

    // Get paymaster data (user will confirm in MetaMask)
    const paymaster = await getPaymasterData();

    // Use in your transaction
    const tx = await sendTransaction({
      ...txData,
      paymasterAndData: encodePaymaster(paymaster),
    });
  };

  return (
    <div>
      {/* Status indicator like demo.prepaidgas.xyz */}
      <SnapStatusIndicator onConfigureClick={() => setShowConfig(true)} />

      {/* Your app UI */}
      <button onClick={handleTransaction}>Send Transaction</button>

      {/* Config dialog with your UI components */}
      <SnapConfigDialog
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </div>
  );
}
```

### Option 2: Export from Card Receipt

After purchasing a gas card on testnet.prepaidgas.xyz:

```tsx
// In your card receipt component
import { usePrepaidSnap } from '@/hooks/snap/use-prepaid-snap';

function CardReceipt({ card }: { card: PoolCard }) {
  const { connectSnap, addCoupon } = usePrepaidSnap();
  const [exporting, setExporting] = useState(false);

  async function exportToSnap() {
    setExporting(true);
    try {
      // Connect if not already
      await connectSnap();

      // Add the coupon
      await addCoupon({
        paymasterContext: card.paymasterContext,
        paymasterAddress: card.paymasterContract,
        poolType:
          card.poolInfo.paymasterType === 'GasLimited'
            ? 'multi-use'
            : 'single-use',
        chainId: card.chainId,
        network: card.poolInfo.network,
        label: `Gas Card ${card.id}`,
      });

      alert('Coupon added to MetaMask Snap!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export to snap');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      {/* Your receipt UI */}
      <button onClick={exportToSnap} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Add to MetaMask Snap'}
      </button>
    </div>
  );
}
```

### Status Indicators

Show configuration status like [demo.prepaidgas.xyz](https://demo.prepaidgas.xyz/):

```tsx
import { SnapStatusIndicator } from '@/components/features/snap/snap-status-indicator';

function MyDapp() {
  return (
    <div>
      <h1>My Dapp</h1>

      {/* Shows: ✓ Configured or ❌ Required */}
      <SnapStatusIndicator onConfigureClick={() => setShowConfigDialog(true)} />

      {/* Your app content */}
    </div>
  );
}
```

### Complete Demo Example

See `/apps/web/app/demo-with-snap/page.tsx` for a complete counter app example with:

- Status indicators
- Configuration dialog
- Gasless transactions
- Coupon selection

## Development

### Project Structure

```
packages/prepaidgas-snap/
├── packages/
│   ├── snap/                           # The MetaMask Snap
│   │   ├── src/
│   │   │   ├── index.tsx              # Main snap implementation
│   │   │   ├── types.ts               # Type definitions
│   │   │   └── snap-client.ts         # Dapp integration helpers
│   │   ├── dist/                      # Built files
│   │   ├── snap.manifest.json         # Snap configuration
│   │   └── package.json
│   └── site/                          # Companion site (localhost:8000)
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/                # Self-contained UI components
│       │   │   │   ├── Button.tsx
│       │   │   │   └── Input.tsx
│       │   │   └── PrepaidConfig.tsx  # Coupon management UI
│       │   ├── hooks/
│       │   │   └── usePrepaidSnap.ts  # Snap integration hook
│       │   └── pages/
│       │       └── index.tsx          # Main page
│       └── package.json
└── README.md                          # COMPLETE documentation (this file)
```

**Self-Contained Site:**

- ✅ No dependencies on `/packages/ui` or main monorepo
- ✅ All UI components copied and adapted
- ✅ Full coupon management interface
- ✅ Status indicators and configuration dialogs

### Commands

```bash
yarn build        # Build the snap
yarn start        # Development mode (watch + serve)
yarn test         # Run tests
yarn lint         # Check code
yarn lint:fix     # Fix linting issues
```

### Testing in Browser Console

```javascript
// 1. Connect
await window.ethereum.request({
  method: 'wallet_requestSnaps',
  params: { 'local:http://localhost:8080': {} },
});

// 2. Add test coupon
await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'local:http://localhost:8080',
    request: {
      method: 'addCoupon',
      params: {
        paymasterContext: '0x1234567890abcdef',
        paymasterAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        poolType: 'multi-use',
        chainId: '11155111',
        network: 'sepolia',
        label: 'Test Coupon',
      },
    },
  },
});

// 3. List coupons
const coupons = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'local:http://localhost:8080',
    request: { method: 'listCoupons' },
  },
});
console.log('Coupons:', coupons);

// 4. Get paymaster data
const paymaster = await window.ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: 'local:http://localhost:8080',
    request: {
      method: 'getPaymasterCallData',
      params: { couponId: coupons[0].id },
    },
  },
});
console.log('Paymaster:', paymaster);
```

### Debugging

1. **View Snap Logs**: MetaMask Flask → Settings → Snaps → Prepaid Gas Manager → View Logs
2. **Check State**: Look at stored coupons with `listCoupons`
3. **Reinstall**: If issues persist, remove and reinstall the snap

### Common Issues

**Form not showing / Stuck on "Update Snap"**

1. **Clear cache and restart:**

   ```bash
   cd packages/prepaidgas-snap
   pkill -f "gatsby|webpack"  # Kill processes
   cd packages/site && rm -rf .cache public  # Clear cache
   cd ../.. && yarn start  # Restart
   ```

2. **Check browser console** - Look for debug logs:

   - "PrepaidConfig mounted" - Component loaded
   - "Index page state" - Shows snap connection status
   - If `installedSnap: false`, click "Connect to Snap" again

3. **Reconnect the snap:**

   - Open MetaMask → Settings → Snaps → Prepaid Gas Manager
   - Click "Remove" then reconnect

4. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**Snap won't install**

- Ensure MetaMask Flask is installed (not regular MetaMask)
- Check `yarn start` is running
- Clear cache: Settings → Advanced → Clear cache

**Method not found**

- Verify method name matches exactly (case-sensitive)
- Rebuild snap after code changes

**State not persisting**

- State should persist automatically via `snap_manageState`
- Check MetaMask Settings → Snaps → View state

**404 errors in console**

- Normal during Gatsby hot reload
- Clear `.cache` and `public` folders
- Restart with `yarn start`

## Security

### Data Protection

- `paymasterContext` is sensitive (like a private key)
- Only exposed via `getPaymasterCallData` with user confirmation
- All public methods exclude sensitive context

### User Consent

Operations requiring confirmation:

- Adding coupons
- Removing coupons
- Getting paymaster data
- Clearing all coupons

### Validation

- Ethereum address format (0x + 40 hex chars)
- Paymaster context format (hex or base64)
- Required parameter checking
- Duplicate coupon detection

## Coupon Code Format

The coupon code should contain (JSON or encoded):

```typescript
{
  paymasterContext: string; // Semaphore proof/identity
  paymasterAddress: string; // Paymaster contract
  poolType: string; // Pool type
  chainId: string; // Chain ID
  network: string; // Network name
}
```

Implement `parseCouponCode()` in your dapp to extract this data from QR codes or text.

## Permissions

- `snap_dialog`: Display UI
- `snap_manageState`: Secure storage
- `endowment:rpc`: Expose custom methods to dapps

## Deployment to Vercel

### Quick Deploy

```bash
cd packages/prepaidgas-snap/packages/site

# Install Vercel CLI (first time only)
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### What Gets Deployed

**✅ Site** (companion UI at http://localhost:8000) → Deploys to Vercel

- Gets a URL like: `https://prepaidgas-snap.vercel.app`
- Users can install the snap and configure coupons
- Includes the counter demo

**❌ Snap** (http://localhost:8080) → Does NOT deploy to Vercel

- MetaMask Snaps can't be hosted on web servers
- Either: Run locally for development
- Or: Publish to npm for production use

### After Deployment

Your site will be live at: `https://prepaidgas-snap-xxx.vercel.app`

**The snap will still run locally** - users need to:

1. Run `yarn start` in packages/snap/ to start the snap server
2. Visit your Vercel site to use the UI
3. Connect to `local:http://localhost:8080`

### For Full Production

To make it work without local snap server:

1. **Publish snap to npm:**

   ```bash
   cd packages/snap
   yarn build
   npm publish
   ```

2. **Update snap origin in site:**

   ```typescript
   // packages/site/src/config/snap.ts
   export const defaultSnapOrigin = 'npm:prepaidgas-snap';
   ```

3. **Redeploy site:**
   ```bash
   vercel --prod
   ```

Now users can just visit your Vercel site and the snap installs from npm!

## Links

- **Website**: https://testnet.prepaidgas.xyz
- **Demo App**: https://demo.prepaidgas.xyz
- **MetaMask Snaps Docs**: https://docs.metamask.io/snaps/
- **Semaphore Protocol**: https://semaphore.pse.dev/

## License

(MIT-0 OR Apache-2.0)
