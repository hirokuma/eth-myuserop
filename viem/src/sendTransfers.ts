import {
  createPublicClient,
  createWalletClient,
  http,
  encodePacked,
  encodeFunctionData,
  encodeAbiParameters,
  maxUint64,
  keccak256,
  parseAbi,
} from 'viem';
import type { Address, Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';

// MyUserOp contract address (replace with actual deployed address)
import deployed from '../../broadcast/Deploy.s.sol/31337/run-latest.json' with { type: 'json' };
const myUserOpAddress = deployed.transactions[0]?.contractAddress as Address;

const entryPoint_0_9_0 = '0x433709009B8330FDa32311DF1C2AFA402eD8D009';
const entryPointAddress = entryPoint_0_9_0;

const NONCE_KEY = 0x123400000000000000000000000000000000000000000000n;
const ACCOUNT0: Address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const ACCOUNT0_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ACCOUNT1: Address = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const ACCOUNT1_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const ACCOUNT2: Address = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
const ACCOUNT2_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';

const BOB: Address = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

// ChatGPTで適当に値を作ってもらった
const verificationGasLimit = 150_000n;
const callGasLimit = 500_000n;
const maxPriorityFeePerGas = 2_000_000_000n;
const maxFeePerGas = 30_000_000_000n;

// ERC-7821 batch mode: bytes32(0x01 || 0x00 || selector 0x00000000 || payload 0x00..)
const BATCH_MODE = '0x0100000000000000000000000000000000000000000000000000000000000000' as Hex;

type PackedUserOperation = {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex; // bytes32
  preVerificationGas: bigint;
  gasFees: Hex; // bytes32
  paymasterAndData: Hex;
  signature: Hex;
};

type Execution = {
  target: Address;
  value: bigint;
  callData: Hex;
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
  { name: 'signature', type: 'bytes' },
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
  const nonce = (await client.readContract({
    address: entryPointAddress,
    abi: parseAbi([
      'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
    ]),
    functionName: 'getNonce',
    args: [account, nonceKey],
  })) as bigint;
  return nonce;
}

async function getUserOpHash(op: PackedUserOperation): Promise<Hex> {
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
            components: PackedUserOperationComponent,
          },
        ],
        outputs: [{ type: 'bytes32' }],
      },
    ] as const,
    functionName: 'getUserOpHash',
    args: [op],
  });
  console.log(`userOpHash=${hash}`);
  return hash;
}

function encodeExecutionBatch(executions: Execution[]): Hex {
  return encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    [executions],
  );
}

function executeBatchCallData(executions: Execution[]): Hex {
  const executionData = encodeExecutionBatch(executions);
  return encodeFunctionData({
    abi: parseAbi([
      'function execute(bytes32 mode, bytes calldata executionData) external payable',
    ]),
    functionName: 'execute',
    args: [BATCH_MODE, executionData],
  });
}

function encodeMultiSignature(signers: Hex[], signatures: Hex[]): Hex {
  return encodeAbiParameters(
    [{ type: 'bytes[]' }, { type: 'bytes[]' }],
    [signers, signatures],
  );
}

async function signPackedUserOperationMulti(
  po: PackedUserOperation,
  signers: { address: Address; privateKey: Hex }[],
): Promise<Hex> {
  const hash = await getUserOpHash(po);

  // MultiSignerERC7913 expects signer bytes to be sorted by keccak256 hash for gas efficiency
  const signerEntries = signers
    .map((s) => ({
      signerBytes: encodePacked(['address'], [s.address]),
      rawSignature: '',
      address: s.address,
      privateKey: s.privateKey,
    }))
    .map((entry) => ({
      ...entry,
      sortKey: keccak256(entry.signerBytes),
    }))
    .sort((a, b) => (a.sortKey < b.sortKey ? -1 : a.sortKey > b.sortKey ? 1 : 0));

  for (const entry of signerEntries) {
    const account = privateKeyToAccount(entry.privateKey);
    entry.rawSignature = await account.sign({ hash });
  }

  return encodeMultiSignature(
    signerEntries.map((e) => e.signerBytes),
    signerEntries.map((e) => e.rawSignature as Hex),
  );
}

function createPackedUserOperation(
  sender: Address,
  nonce: bigint,
  callData: Hex,
): PackedUserOperation {
  const accountGasLimits = encodePacked(
    ['uint128', 'uint128'],
    [verificationGasLimit, callGasLimit],
  );
  const gasFees = encodePacked(
    ['uint128', 'uint128'],
    [maxPriorityFeePerGas, maxFeePerGas],
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
    signature: '0x',
  };
}

async function getSigners(): Promise<Hex[]> {
  const signers = (await client.readContract({
    address: myUserOpAddress,
    abi: parseAbi([
      'function getSigners(uint64 start, uint64 end) external view returns (bytes[] memory signers)',
    ]),
    functionName: 'getSigners',
    args: [0n, maxUint64],
  })) as Hex[];
  return signers;
}

async function submitUserOperation(op: PackedUserOperation): Promise<Hex> {
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
            components: PackedUserOperationComponent,
          },
          { name: 'beneficiary', type: 'address' },
        ],
        outputs: [],
      },
    ] as const,
    functionName: 'handleOps',
    args: [[op], ACCOUNT0],
    value: 0n,
  });

  console.log('Wait for transaction receipt...');
  const receipt = await client.waitForTransactionReceipt({ hash: txhash });
  if (receipt.status !== 'success') {
    console.error(`fail get receipt(tx_hash=${txhash}): ${receipt.status}`);
    process.exit(1);
  }
  return txhash;
}

// ---------------------------------------------------------
// 送金ヘルパー
// ---------------------------------------------------------

function transferEthExecution(to: Address, amount: bigint): Execution {
  return { target: to, value: amount, callData: '0x' };
}

function transferErc20Execution(token: Address, to: Address, amount: bigint): Execution {
  const callData = encodeFunctionData({
    abi: parseAbi(['function transfer(address to, uint256 amount) external returns (bool)']),
    functionName: 'transfer',
    args: [to, amount],
  });
  return { target: token, value: 0n, callData };
}

// ---------------------------------------------------------
// 残高取得ヘルパー
// ---------------------------------------------------------

async function getEthBalance(address: Address): Promise<bigint> {
  return client.getBalance({ address });
}

async function getErc20Balance(token: Address, address: Address): Promise<bigint> {
  return (await client.readContract({
    address: token,
    abi: parseAbi([
      'function balanceOf(address account) external view returns (uint256 balance)',
    ]),
    functionName: 'balanceOf',
    args: [address],
  })) as bigint;
}

// ---------------------------------------------------------
// メイン実行
// ---------------------------------------------------------

async function main() {
  const blockNumber = await client.getBlockNumber();
  console.log(`blockNumber=${blockNumber}`);

  const currentSigners = await getSigners();
  console.log(`current signers=${JSON.stringify(currentSigners)}`);

  // 1) ETH 送金
  console.log('==========');
  console.log('Send ETH');
  console.log('==========');
  let userEth = await getEthBalance(myUserOpAddress);
  let bobEth = await getEthBalance(BOB);
  console.log(`Before ETH: MyUserOP=${userEth}, BOB=${bobEth}`);

  const ethExecutions: Execution[] = [
    transferEthExecution(BOB, 1_000_000_000_000_000n), // 0.001 ETH
  ];
  const ethCallData = executeBatchCallData(ethExecutions);
  const ethNonce = await getNonce(myUserOpAddress, NONCE_KEY);
  const ethUnsignedOp = createPackedUserOperation(myUserOpAddress, ethNonce, ethCallData);
  const ethSignature = await signPackedUserOperationMulti(ethUnsignedOp, [
    { address: ACCOUNT0, privateKey: ACCOUNT0_KEY },
    { address: ACCOUNT1, privateKey: ACCOUNT1_KEY },
  ]);
  const ethSignedOp: PackedUserOperation = { ...ethUnsignedOp, signature: ethSignature };
  await submitUserOperation(ethSignedOp);
  console.log(`ETH transfer done: ${ethSignedOp.sender} -> ${BOB}`);
  userEth = await getEthBalance(myUserOpAddress);
  bobEth = await getEthBalance(BOB);
  console.log(`After ETH: MyUserOP=${userEth}, BOB=${bobEth}`);
  console.log();

  // 2) ERC-20 送金
  const tokenAddress = deployed.transactions[1]?.contractAddress as Address;
  console.log('==========');
  console.log(`Send ERC20: ${tokenAddress}`);
  console.log('==========');
  let userErc = await getErc20Balance(tokenAddress, myUserOpAddress);
  let bobErc = await getErc20Balance(tokenAddress, BOB);
  console.log(`Before ERC20: MyUserOP=${userErc}, BOB=${bobErc}`);

  const mintAndTransferExecutions: Execution[] = [
    transferErc20Execution(tokenAddress, BOB, 1n ** 18n),
  ];
  const erc20CallData = executeBatchCallData(mintAndTransferExecutions);
  const erc20Nonce = await getNonce(myUserOpAddress, NONCE_KEY);
  const erc20UnsignedOp = createPackedUserOperation(myUserOpAddress, erc20Nonce, erc20CallData);
  const erc20Signature = await signPackedUserOperationMulti(erc20UnsignedOp, [
    { address: ACCOUNT0, privateKey: ACCOUNT0_KEY },
    { address: ACCOUNT1, privateKey: ACCOUNT1_KEY },
  ]);
  const erc20SignedOp: PackedUserOperation = { ...erc20UnsignedOp, signature: erc20Signature };
  await submitUserOperation(erc20SignedOp);
  console.log(`ERC-20 transfer done: ${ethSignedOp.sender} -> ${BOB}`);
  userErc = await getErc20Balance(tokenAddress, myUserOpAddress);
  bobErc = await getErc20Balance(tokenAddress, BOB);
  console.log(`After ERC20: MyUserOP=${userErc}, BOB=${bobErc}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
