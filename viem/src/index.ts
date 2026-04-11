import { createPublicClient, http, encodePacked, encodeFunctionData } from 'viem';
import type { Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts'
import { anvil } from 'viem/chains';

import deployed from '../../broadcast/Deploy.s.sol/31337/run-latest.json';

const entryPoint_0_9_0 = '0x433709009B8330FDa32311DF1C2AFA402eD8D009';

const client = createPublicClient({
  chain: anvil,
  transport: http(),
});

const NONCE_KEY = 0xabcd00001234n;
const ACCOUNT0: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const ACCOUNT0_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ACCOUNT1: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// ChatGPTで適当に値を作ってもらった
const verificationGasLimit = 150_000n;
const callGasLimit = 500_000n;
const maxPriorityFeePerGas = 2_000_000_000n;
const maxFeePerGas = 30_000_000_000n;

let blockNumber = await client.getBlockNumber();
console.log(blockNumber);

// https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/INonceManager.sol#L15-L16
// function getNonce(address sender, uint192 key)
// external view returns (uint256 nonce);
const nonce = await client.readContract({
  address: entryPoint_0_9_0,
  abi: [{
    type: 'function',
    name: 'getNonce',
    stateMutability: 'external view',
    inputs: [{ type: 'address' }, { type: 'uint192' }],
    outputs: [{ type: 'uint256' }],
  }],
  functionName: 'getNonce',
  args: [ACCOUNT0, NONCE_KEY]
}) as bigint;
console.log(`nonce=0x${nonce.toString(16)}`);

// https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/PackedUserOperation.sol#L36-L46
type PackedUserOperation = {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  accountGasLimits: Hex   // bytes32
  preVerificationGas: bigint
  gasFees: Hex            // bytes32
  paymasterAndData: Hex
  signature: Hex
}
const PackedUserOperationComponent = [
  { name: 'sender', type: 'address' },
  { name: 'nonce', type: 'uint256' },
  { name: 'initCode', type: 'bytes' },
  { name: 'callData', type: 'bytes' },
  { name: 'accountGasLimits', type: 'bytes32' },
  { name: 'preVerificationGas', type: 'uint256' },
  { name: 'gasFees', type: 'bytes32' },
  { name: 'paymasterAndData', type: 'bytes' },
  { name: 'signature', type: 'bytes' }
];

const signers: Hex[] = [ACCOUNT1 as Hex];
const callData = encodeFunctionData({
  abi: [
    {
      type: 'function',
      name: 'addSigners',
      stateMutability: 'public',
      inputs: [
        {
          name: 'signers',
          type: 'bytes[]'
        }
      ],
      outputs: []
    }
  ] as const,
  functionName: 'addSigners',
  args: [signers]
});

const sender = deployed.transactions[0]?.contractAddress as Address;
const accountGasLimits = encodePacked(
  ['uint128', 'uint128'],
  [verificationGasLimit, callGasLimit]
);
const gasFees = encodePacked(
  ['uint128', 'uint128'],
  [maxPriorityFeePerGas, maxFeePerGas]
);
let puo: PackedUserOperation = {
  sender,
  nonce,
  initCode: '0x',
  callData,
  accountGasLimits,
  preVerificationGas: 21_000n,
  gasFees,
  paymasterAndData: '0x',
  signature: '0x'
};

// https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/IEntryPoint.sol#L209-L211
const hash = await client.readContract({
  address: entryPoint_0_9_0,
  abi: [
    {
      type: 'function',
      name: 'getUserOpHash',
      stateMutability: 'view',
      inputs: [
        {
          name: 'userOp',
          type: 'tuple',
          components: PackedUserOperationComponent
        }
      ],
      outputs: [{ type: 'bytes32' }]
    }
  ] as const,
  functionName: 'getUserOpHash',
  args: [puo]
});
console.log(`userOpHash=${hash}`);

const account = privateKeyToAccount(ACCOUNT0_KEY);
puo.signature =  await account.sign({ hash });
console.log(`signature=${puo.signature}`);

