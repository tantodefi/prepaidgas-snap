/**
 * Counter Contract Configuration
 * 
 * TODO: Update these values with your actual deployed counter contract
 * The counter contract from demo.prepaidgas.xyz
 */

// Simple Counter ABI - just the functions we need
export const COUNTER_ABI = [
  {
    inputs: [],
    name: 'increment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'count',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'number',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// TODO: Replace with your actual counter contract address
// Get this from demo.prepaidgas.xyz or your deployment
export const COUNTER_ADDRESS = process.env.NEXT_PUBLIC_COUNTER_ADDRESS || 
  '0x0000000000000000000000000000000000000000'; // Placeholder

// Network configuration
export const COUNTER_CHAIN_ID = 11155111; // Sepolia
export const COUNTER_NETWORK = 'sepolia';

// Whether to use real contract or simulation
export const USE_REAL_CONTRACT = false; // Set to true when contract is configured

