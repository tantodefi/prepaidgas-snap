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
// Enable real contract transactions with MetaMask Delegation Toolkit
// Using official @metamask/delegation-toolkit for EIP-7702
// Docs: https://docs.metamask.io/delegation-toolkit/get-started/smart-account-quickstart/eip7702
//
// BUNDLER OPTIONS (set in metamask-7702.ts):
// 1. Flashbots Sepolia Relay (DEFAULT): https://relay-sepolia.flashbots.net
//    - No setup needed, works out of the box
//    - Docs: https://docs.flashbots.net/flashbots-auction/advanced/rpc-endpoint
//
// 2. Local Bundler: http://localhost:4337
//    - Clone: https://github.com/eth-infinitism/bundler
//    - Run: yarn && yarn preprocess && yarn hardhat-node
//    - Run: yarn run bundler (in another terminal)
//
// 3. Cloud Bundler: Set NEXT_PUBLIC_BUNDLER_URL environment variable
//    - Pimlico: https://api.pimlico.io/v2/base-sepolia/rpc?apikey=KEY
//    - Alchemy: https://alchemy.com bundler endpoint
//
// REQUIREMENTS:
// - Base Sepolia testnet ETH in your account
// - Prepaid gas coupon added to snap
//
export const USE_REAL_CONTRACT = true; // ✅ ENABLED - Real EIP-7702 transactions!
