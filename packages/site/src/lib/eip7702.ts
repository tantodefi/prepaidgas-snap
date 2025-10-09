/**
 * EIP-7702: Set EOA Account Code
 * Allows MetaMask EOAs to delegate to smart account code
 *
 * This enables gasless transactions with paymaster using user's existing MetaMask account!
 */

import { COUNTER_CHAIN_ID } from '../config/counter-contract';

// Simple Account implementation address (ERC-4337)
// This is the contract code that the EOA will delegate to
const SIMPLE_ACCOUNT_IMPLEMENTATION = '0x...'; // TODO: Deploy or use existing

/**
 * Create EIP-7702 authorization to upgrade EOA to smart account
 */
export async function create7702Authorization(userAddress: string) {
  // EIP-7702 authorization structure
  const authorization = {
    chainId: COUNTER_CHAIN_ID,
    address: SIMPLE_ACCOUNT_IMPLEMENTATION, // Contract to delegate to
    nonce: 0, // First authorization
  };

  // Sign the authorization with user's MetaMask account
  // This is a typed data signature
  const domain = {
    name: 'Set Code',
    version: '1',
    chainId: COUNTER_CHAIN_ID,
  };

  const types = {
    Authorization: [
      { name: 'chainId', type: 'uint256' },
      { name: 'address', type: 'address' },
      { name: 'nonce', type: 'uint64' },
    ],
  };

  try {
    const signature = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [
        userAddress,
        JSON.stringify({
          domain,
          primaryType: 'Authorization',
          types,
          message: authorization,
        }),
      ],
    });

    return {
      ...authorization,
      signature,
    };
  } catch (error) {
    console.error('Failed to sign 7702 authorization:', error);
    throw error;
  }
}

/**
 * Send transaction with 7702 authorization and paymaster
 */
export async function sendTransactionWith7702(params: {
  from: string;
  to: string;
  data: string;
  authorizationList: any[];
  paymasterAndData: string;
}) {
  // EIP-7702 transaction type
  const tx = {
    from: params.from,
    to: params.to,
    data: params.data,
    value: '0x0',
    type: '0x04', // EIP-7702 transaction type
    authorizationList: params.authorizationList,
    // Paymaster data
    paymasterAndData: params.paymasterAndData,
  };

  return await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [tx],
  });
}

declare global {
  interface Window {
    ethereum: any;
  }
}
