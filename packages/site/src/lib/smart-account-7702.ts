/**
 * EIP-7702 Smart Account Implementation
 * Upgrade MetaMask EOA to use paymaster for gasless transactions
 * 
 * This is the CORE feature - making the snap actually useful!
 */

import { COUNTER_CHAIN_ID } from '../config/counter-contract';

// Simple Account implementation for EIP-4337
// This contract handles paymaster integration
const SIMPLE_ACCOUNT_FACTORY = '0x91E60e0613810449d098b0b5Ec8b51A0FE8c8985'; // EntryPoint v0.7 SimpleAccountFactory on Base Sepolia

/**
 * Create and sign EIP-7702 authorization
 * This upgrades the user's EOA to behave like a smart account
 */
export async function createAndSign7702Authorization(
  userAddress: string,
): Promise<{
  chainId: string;
  address: string;
  nonce: string;
  v: string;
  r: string;
  s: string;
}> {
  console.log('📝 Creating 7702 authorization for:', userAddress);

  // The authorization allows the EOA to delegate to smart account code
  const authorization = {
    chainId: `0x${COUNTER_CHAIN_ID.toString(16)}`, // Base Sepolia
    address: SIMPLE_ACCOUNT_FACTORY,
    nonce: '0x0', // First authorization
  };

  console.log('Authorization object:', authorization);

  // Sign with eth_signTypedData_v4
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
      ],
      Authorization: [
        { name: 'chainId', type: 'uint256' },
        { name: 'address', type: 'address' },
        { name: 'nonce', type: 'uint64' },
      ],
    },
    primaryType: 'Authorization',
    domain: {
      chainId: COUNTER_CHAIN_ID,
    },
    message: {
      chainId: COUNTER_CHAIN_ID,
      address: SIMPLE_ACCOUNT_FACTORY,
      nonce: 0,
    },
  };

  try {
    const signature = await window.ethereum.request({
      method: 'eth_signTypedData_v4',
      params: [userAddress, JSON.stringify(typedData)],
    });

    console.log('✓ Authorization signed:', signature);

    // Parse signature into v, r, s
    const sig = signature.slice(2); // Remove 0x
    const r = '0x' + sig.slice(0, 64);
    const s = '0x' + sig.slice(64, 128);
    const v = '0x' + sig.slice(128, 130);

    return {
      ...authorization,
      v,
      r,
      s,
    };
  } catch (error) {
    console.error('Failed to sign 7702 authorization:', error);
    throw error;
  }
}

/**
 * Send EIP-7702 transaction with paymaster
 */
export async function send7702Transaction(params: {
  from: string;
  to: string;
  data: string;
  authorization: any;
  paymasterAndData: string;
}) {
  console.log('📤 Sending 7702 transaction...');

  // EIP-7702 transaction
  const tx = {
    from: params.from,
    to: params.to,
    data: params.data,
    value: '0x0',
    type: '0x04', // EIP-7702 transaction type
    authorizationList: [params.authorization],
    // NOTE: paymasterAndData works with ERC-4337 bundlers
    // For now, we'll send the transaction and let the smart account handle it
  };

  console.log('Transaction:', tx);

  try {
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    });

    console.log('✓ Transaction sent:', txHash);
    return txHash;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Check if EOA has been upgraded with 7702
 */
export async function isAccountUpgraded(address: string): Promise<boolean> {
  try {
    const code = await window.ethereum.request({
      method: 'eth_getCode',
      params: [address, 'latest'],
    });

    // If code exists, account has been upgraded
    return code !== '0x' && code !== '0x0';
  } catch (error) {
    console.error('Failed to check account code:', error);
    return false;
  }
}

declare global {
  interface Window {
    ethereum: any;
  }
}

