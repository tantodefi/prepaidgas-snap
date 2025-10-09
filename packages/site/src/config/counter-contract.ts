/**
 * Counter Contract Configuration
 * From demo.prepaidgas.xyz demo-counter-app
 * Contract deployed on Base Sepolia at 0x18B5EF94Bd6212d4764853142215F917c353011e
 */

// Counter ABI (from prepaid-gas-packages/apps/demo-counter-app/lib/contracts/counter.ts)
export const COUNTER_ABI = [
  {
    inputs: [],
    name: 'count',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'increment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newCount',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'CounterIncremented',
    type: 'event',
  },
] as const;

// Counter contract address on Base Sepolia
export const COUNTER_ADDRESS =
  '0x18B5EF94Bd6212d4764853142215F917c353011e' as const;

// Network configuration - Base Sepolia
export const COUNTER_CHAIN_ID = 84532;
export const COUNTER_NETWORK = 'base-sepolia';

// RPC endpoint for Base Sepolia
export const COUNTER_RPC_URL = 'https://sepolia.base.org';

// Enable real contract transactions
// NOTE: Real paymaster transactions require smart account setup
// See demo-counter-app for full implementation with smartAccountClient
export const USE_REAL_CONTRACT = false;
