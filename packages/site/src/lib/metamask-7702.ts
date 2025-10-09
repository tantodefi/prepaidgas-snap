/**
 * MetaMask EIP-7702 Implementation
 * Using official @metamask/delegation-toolkit
 *
 * Docs: https://docs.metamask.io/delegation-toolkit/get-started/smart-account-quickstart/eip7702
 */

import {
  Implementation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from '@metamask/delegation-toolkit';
import {
  createPublicClient,
  createWalletClient,
  http,
  type WalletClient,
  type PublicClient,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { createBundlerClient } from 'viem/account-abstraction';
import { COUNTER_CHAIN_ID } from '../config/counter-contract';

// Bundler RPC endpoint - required for user operations
const BUNDLER_RPC =
  process.env.NEXT_PUBLIC_BUNDLER_RPC ||
  'https://api.pimlico.io/v2/base-sepolia/rpc?apikey=YOUR_API_KEY';

/**
 * Set up clients for 7702
 */
export function setupClients() {
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  const bundlerClient = createBundlerClient({
    client: publicClient,
    transport: http(BUNDLER_RPC),
  });

  return { publicClient, bundlerClient };
}

/**
 * Authorize EIP-7702 delegation using MetaMask's approach
 * This upgrades the EOA to support smart account features
 */
export async function authorizeMetaMask7702(account: Account) {
  console.log('📝 Authorizing 7702 with MetaMask Delegation Toolkit...');

  // Get the stateless 7702 delegator contract for this network
  const environment = getDeleGatorEnvironment(COUNTER_CHAIN_ID);
  const contractAddress =
    environment.implementations.EIP7702StatelessDeleGatorImpl;

  console.log('Contract address:', contractAddress);

  // Create wallet client for signing
  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  });

  try {
    // Sign the authorization using viem's signAuthorization action
    const authorization = await walletClient.signAuthorization({
      account,
      contractAddress,
      // @ts-ignore - executor type
      executor: 'self',
    });

    console.log('✅ Authorization signed:', authorization);
    return authorization;
  } catch (error) {
    console.error('Failed to sign authorization:', error);
    throw error;
  }
}

/**
 * Submit the 7702 authorization transaction
 * Includes a dummy transaction to activate the authorization
 */
export async function submit7702Authorization(
  walletClient: any,
  authorization: any,
) {
  console.log('📤 Submitting 7702 authorization...');

  try {
    const hash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      data: '0x',
      to: '0x0000000000000000000000000000000000000000',
    });

    console.log('✅ Authorization tx sent:', hash);
    return hash;
  } catch (error) {
    console.error('Failed to submit authorization:', error);
    throw error;
  }
}

/**
 * Create MetaMask Smart Account from upgraded EOA
 */
export async function createMetaMaskSmartAccount(
  address: string,
  publicClient: any,
  walletClient: any,
) {
  console.log('🔧 Creating MetaMask Smart Account...');

  try {
    const smartAccount = await toMetaMaskSmartAccount({
      client: publicClient,
      implementation: Implementation.Stateless7702,
      address: address as `0x${string}`,
      signer: { walletClient },
    });

    console.log('✅ Smart Account created:', smartAccount.address);
    return smartAccount;
  } catch (error) {
    console.error('Failed to create smart account:', error);
    throw error;
  }
}

/**
 * Send user operation with paymaster
 */
export async function sendUserOperationWithPaymaster(params: {
  bundlerClient: any;
  smartAccount: any;
  to: string;
  data: string;
  paymasterAndData?: string;
}) {
  console.log('📤 Sending user operation with paymaster...');

  try {
    const userOpHash = await params.bundlerClient.sendUserOperation({
      account: params.smartAccount,
      calls: [
        {
          to: params.to,
          data: params.data,
          value: 0n,
        },
      ],
      // TODO: Determine appropriate gas values
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      // Paymaster data
      paymaster: params.paymasterAndData,
    });

    console.log('✅ User operation sent:', userOpHash);
    return userOpHash;
  } catch (error) {
    console.error('Failed to send user operation:', error);
    throw error;
  }
}
