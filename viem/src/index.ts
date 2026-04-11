import { createPublicClient, http } from 'viem'
import { anvil } from 'viem/chains'

const entryPoint_0_9_0 = '0x433709009B8330FDa32311DF1C2AFA402eD8D009';

const client = createPublicClient({ 
  chain: anvil, 
  transport: http(), 
}) 

const blockNumber = await client.getBlockNumber() 
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
  args: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 0xabcd00001234n]
}) as bigint;
console.log(`nonce=0x${nonce.toString(16)}`);
