# EIP-7702 Implementation Guide

## Why EIP-7702 for Prepaid Gas Snap?

**The Problem**: A "Prepaid Gas Snap" that can't actually sponsor gas is incomplete.

**The Solution**: Use EIP-7702 to upgrade MetaMask EOAs to smart accounts that can use paymaster!

## Architecture

```
┌─────────────────────────────────────────────┐
│ User's MetaMask EOA (0xUser...)             │
│ ↓ EIP-7702 Authorization                    │
│ ↓ Delegates to SimpleAccount code           │
│ = Acts as Smart Account ✓                   │
├─────────────────────────────────────────────┤
│ Prepaid Gas Snap                            │
│ - Stores paymaster coupons                  │
│ - Provides paymasterAndData                 │
├─────────────────────────────────────────────┤
│ Transaction Flow:                           │
│ 1. Get paymaster data from snap             │
│ 2. Construct 7702 transaction               │
│ 3. Add authorizationList                    │
│ 4. Add paymasterAndData                     │
│ 5. Send via eth_sendTransaction             │
│ 6. ✓ Gasless transaction!                   │
└─────────────────────────────────────────────┘
```

## Benefits vs. Burner Smart Account

### Burner Approach (demo-counter-app):
- ❌ Two separate accounts
- ❌ Burner key in localStorage (security risk)
- ❌ Not visible in MetaMask
- ❌ Confusing UX

### EIP-7702 Approach (This Snap):
- ✅ **Single account** - user's MetaMask EOA
- ✅ **Secure** - private key stays in MetaMask
- ✅ **Visible** - shows in wallet
- ✅ **Seamless UX** - "it just works"

## Implementation Status

### ✅ Completed:
1. Snap stores coupons securely
2. Snap provides `getPaymasterCallData()` API
3. Interactive forms in MetaMask
4. Counter reads real on-chain value
5. Network switching to Base Sepolia
6. EIP-7702 helper functions created

### 🚧 To Complete:
1. **Deploy SimpleAccount implementation** (or use existing)
2. **Test 7702 authorization signing** in MetaMask
3. **Integrate paymasterAndData** with 7702 transactions
4. **Enable in CounterDemo**

## How to Enable (When Ready)

### Step 1: Configure Simple Account Address

In `src/lib/smart-account-7702.ts`:
```typescript
const SIMPLE_ACCOUNT_FACTORY = '0x...'; // Your deployed SimpleAccount
```

### Step 2: Add "Upgrade Account" Button

Users click to sign 7702 authorization:
```typescript
const authorization = await createAndSign7702Authorization(userAddress);
localStorage.setItem('7702_auth', JSON.stringify(authorization));
```

### Step 3: Use in Transactions

```typescript
const paymasterData = await getPaymasterData(couponId);
const authorization = JSON.parse(localStorage.getItem('7702_auth'));

await send7702Transaction({
  from: userAddress,
  to: COUNTER_ADDRESS,
  data: incrementData,
  authorization,
  paymasterAndData: paymasterData.paymasterContext,
});
```

## Current Limitations

### EIP-7702 Status:
- ⚠️ **Not yet finalized** in Ethereum spec
- ⚠️ **Limited MetaMask support** (may need Flask with experimental features)
- ⚠️ **Needs ERC-4337 bundler** that supports 7702
- ⚠️ **Paymaster integration** needs testing

### Workaround for NOW:

**Option A: Simulation Mode** (Current)
- Shows the full flow
- Reads real counter value
- Demonstrates paymaster retrieval
- Documents how it will work

**Option B: Use demo.prepaidgas.xyz**
- Has working smart account setup
- Can integrate with snap
- Full gasless transactions TODAY

## Next Steps

1. **Test EIP-7702** when MetaMask/networks support it
2. **Deploy SimpleAccount** on Base Sepolia
3. **Wire up** the authorization flow
4. **Enable** real transactions in CounterDemo

## Value Proposition

**What the snap provides:**
- ✅ Secure coupon storage (works NOW)
- ✅ Easy coupon management (works NOW)
- ✅ Paymaster data API (works NOW)
- 🚧 Full gasless txs (needs 7702 support)

**The snap is production-ready** for integration with dapps that have smart account infrastructure. The 7702 upgrade makes it work with user's EOAs directly!

## Files Created

- `src/lib/eip7702.ts` - 7702 helpers (basic)
- `src/lib/smart-account-7702.ts` - Full implementation
- This guide - Architecture and roadmap

## References

- [EIP-7702 Spec](https://eips.ethereum.org/EIPS/eip-7702)
- [Viem 7702 Support](https://viem.sh/)
- [Account Abstraction](https://erc4337.io/)

