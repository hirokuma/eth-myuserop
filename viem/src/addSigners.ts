import { createPublicClient, createWalletClient, http, encodePacked, encodeFunctionData, encodeAbiParameters, maxUint64, parseAbi } from 'viem';
import type { Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

// MyUserOp contract address (replace with actual deployed address)
// const myUserOpAddress: Address = '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9';
import deployed from '../../broadcast/Deploy.s.sol/31337/run-latest.json' with { type: 'json' };
const myUserOpAddress = deployed.transactions[0]?.contractAddress as Address;

// const entryPoint_0_8_0 = '0x4337084d9e255ff0702461cf8895ce9e3b5ff108';
const entryPoint_0_9_0 = '0x433709009B8330FDa32311DF1C2AFA402eD8D009';
const entryPointAddress = entryPoint_0_9_0;

const NONCE_KEY = 0x123400000000000000000000000000000000000000000000n;
const ACCOUNT0: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const ACCOUNT0_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ACCOUNT1: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

// ChatGPTで適当に値を作ってもらったがAnvilには高すぎるようでbeneficiaryに戻るGas代が多くなる
// maxFeePerGasを払い戻しに使っているので値を下げる
const verificationGasLimit = 150_000n;
const callGasLimit = 500_000n;
const maxPriorityFeePerGas = 2_000_000_000n;
const maxFeePerGas = 1_000_000_000n;

// https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/PackedUserOperation.sol#L36-L46
type PackedUserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex;   // bytes32
  preVerificationGas: bigint;
  gasFees: Hex;            // bytes32
  paymasterAndData: Hex;
  signature: Hex;
};

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

const client = createPublicClient({
  chain: anvil,
  transport: http(),
});
const walletClient = createWalletClient({
  account: ACCOUNT0,
  chain: anvil,
  transport: http(),
});

async function getNonce(account: Address, nonceKey: bigint): Promise<bigint> {
  // https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/INonceManager.sol#L15-L16
  const nonce = await client.readContract({
    address: entryPointAddress,
    abi: parseAbi([
      'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
    ]),
    functionName: 'getNonce',
    args: [account, nonceKey]
  }) as bigint;
  return nonce;
}

async function getUserOpHash(op: PackedUserOperation): Promise<Hex> {
  // https://github.com/eth-infinitism/account-abstraction/blob/v0.9.0/contracts/interfaces/IEntryPoint.sol#L209-L211
  const hash = await client.readContract({
    address: entryPointAddress,
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
    args: [op]
  });
  console.log(`userOpHash=${hash}`);
  return hash;
}

function encodeMultiSignature(signers: Hex[], signatures: Hex[]): Hex {
  // MultiSignerERC7913 expects abi.encode(bytes[] signers, bytes[] signatures)
  return encodeAbiParameters(
    [{ type: 'bytes[]' }, { type: 'bytes[]' }],
    [signers, signatures]
  );
}

async function signPackedUserOperation(po: PackedUserOperation, signer: Address, privateKey: Hex): Promise<Hex> {
  const hash = await getUserOpHash(po);
  const account = privateKeyToAccount(privateKey);
  const rawSignature = await account.sign({ hash });
  // ECDSA signer in MultiSignerERC7913 is encoded as the 20-byte address
  const signerBytes = encodePacked(['address'], [signer]);
  return encodeMultiSignature([signerBytes], [rawSignature]);
}

function addSignersCallData(adders: Hex[]): Hex {
  // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.6.1/contracts/utils/cryptography/signers/MultiSignerERC7913.sol#L125
  return encodeFunctionData({
    abi: parseAbi([
      'function addSigners(bytes[] memory signers) external',
    ]),
    functionName: 'addSigners',
    args: [adders]
  });
}

function createPackedUserOperation(
  sender: Address,
  nonce: bigint,
  callData: Hex,
): PackedUserOperation {
  const accountGasLimits = encodePacked(
    ['uint128', 'uint128'],
    [verificationGasLimit, callGasLimit]
  );
  const gasFees = encodePacked(
    ['uint128', 'uint128'],
    [maxPriorityFeePerGas, maxFeePerGas]
  );
  console.log(`sender=${sender}`);
  console.log(`nonce=${nonce.toString(16)}`);
  return {
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
}

async function getSigners(): Promise<Hex[]> {
  // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.6.1/contracts/utils/cryptography/signers/MultiSignerERC7913.sol#L90
  const signers = await client.readContract({
    address: myUserOpAddress,
    abi: parseAbi([
      'function getSigners(uint64 start, uint64 end) external view returns (bytes[] memory signers)',
    ]),
    functionName: 'getSigners',
    args: [0n, maxUint64]
  }) as Hex[];
  return signers;
}

// Connection check
let blockNumber = await client.getBlockNumber();
console.log(`blockNumber=${blockNumber}`);

const currentSigners = await getSigners();
console.log(`current signers=${JSON.stringify(currentSigners)}`);

const sender = myUserOpAddress;
const adders = [ACCOUNT1];
const nonce = await getNonce(sender, NONCE_KEY);

const callData = addSignersCallData(adders);
const unsignedOp = createPackedUserOperation(sender, nonce, callData);
const signature0 = await signPackedUserOperation(unsignedOp, ACCOUNT0, ACCOUNT0_KEY);

const signedOp: PackedUserOperation = { ...unsignedOp, signature: signature0 };

// EntryPoint v0.9 handleOps
const txhash = await walletClient.writeContract({
  address: entryPointAddress,
  abi: [
    {
      type: 'function',
      name: 'handleOps',
      stateMutability: 'payable',
      inputs: [
        {
          name: 'ops',
          type: 'tuple[]',
          components: PackedUserOperationComponent
        },
        {
          name: 'beneficiary',
          type: 'address'
        }
      ],
      outputs: []
    }
  ] as const,
  functionName: 'handleOps',
  args: [[signedOp], ACCOUNT0],
  value: 0n
});

console.log('Wait for transaction receipt...');
const receipt = await client.waitForTransactionReceipt({ hash: txhash });
if (receipt.status !== 'success') {
  console.error(`fail get receipt(tx_hash=${txhash}): ${receipt.status}`);
  process.exit(1);
}

const newSigners = await getSigners();
console.log(`new signers=${JSON.stringify(newSigners)}`);
